import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { ServiceOrder, User, AppNotification, ActivityLogEntry, OrderStatus, UserRole, ActivityActionType, NotificationColorType, Task, Comment, StoredFile } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, getDoc, setDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';

// --- Helper Functions ---
const formatFirestoreTimestamp = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp; // Already a string
};

const mapFirestoreDocToOrder = (doc: any): ServiceOrder => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    creationDate: formatFirestoreTimestamp(data.creationDate),
    lastStatusUpdate: formatFirestoreTimestamp(data.lastStatusUpdate),
    deliveryDate: data.deliveryDate ? formatFirestoreTimestamp(data.deliveryDate) : undefined,
    expectedDeliveryDate: data.expectedDeliveryDate ? formatFirestoreTimestamp(data.expectedDeliveryDate) : undefined,
    comments: data.comments?.map((c: any) => ({ ...c, timestamp: formatFirestoreTimestamp(c.timestamp) })) || [],
  };
};

const mapFirestoreDocToUser = (doc: any): User => ({ id: doc.id, ...doc.data() });
const mapFirestoreDocToActivity = (doc: any): ActivityLogEntry => ({ id: doc.id, ...doc.data(), timestamp: formatFirestoreTimestamp(doc.data().timestamp) });

// --- App Context Interfaces ---
interface AppContextType {
  orders: ServiceOrder[];
  users: User[];
  currentUser: User | null;
  activityLog: ActivityLogEntry[];
  notifications: AppNotification[];
  currentPage: string;
  searchTerm: string;
  isStalledFilterActive: boolean;
  recentlyUpdatedOrderId: string | null;
  isSummaryLoading: boolean;
  filteredOrders: ServiceOrder[];
  deliveredOrders: ServiceOrder[];
  isInitializing: boolean;
  isDataLoading: boolean;
  authError: string | null;
  initializationError: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchAllData: () => Promise<void>;
  setCurrentPage: (page: string) => void;
  addOrder: (newOrderData: Partial<ServiceOrder>) => Promise<void>;
  updateOrder: (updatedOrderData: Partial<ServiceOrder>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  handleStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setIsStalledFilterActive: (isActive: boolean) => void;
  clearFilters: () => void;
  addUser: (user: Omit<User, 'id' | 'picture'> & { picture?: string }) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addTask: (orderId: string, taskText: string) => Promise<void>;
  updateTask: (orderId: string, updatedTask: Task) => Promise<void>;
  deleteTask: (orderId: string, taskId: string) => Promise<void>;
  addComment: (orderId: string, commentText: string) => Promise<void>;
  addFileToOrder: (orderId: string, file: StoredFile) => Promise<void>;
  deleteFileFromOrder: (orderId: string, file: StoredFile) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStalledFilterActive, setIsStalledFilterActive] = useState(false);
  const [recentlyUpdatedOrderId, setRecentlyUpdatedOrderId] = useState<string | null>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    setIsInitializing(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            // Handle case where user exists in Auth but not in Firestore 'users' collection
            throw new Error("Perfil de usuário não encontrado.");
          }
        } catch (error: any) {
            setInitializationError(error.message);
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setOrders([]);
        setUsers([]);
        setActivityLog([]);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!currentUser) {
      setIsDataLoading(false);
      return;
    };
    setIsDataLoading(true);

    const subscriptions = [
      onSnapshot(query(collection(db, 'orders'), orderBy('creationDate', 'desc')), snapshot => {
        setOrders(snapshot.docs.map(mapFirestoreDocToOrder));
        setIsDataLoading(false);
      }, error => { console.error("Error fetching orders:", error); setInitializationError("Falha ao carregar OS."); }),
      onSnapshot(query(collection(db, 'users'), orderBy('name')), snapshot => setUsers(snapshot.docs.map(mapFirestoreDocToUser))),
      onSnapshot(query(collection(db, 'activityLog'), orderBy('timestamp', 'desc')), snapshot => setActivityLog(snapshot.docs.map(mapFirestoreDocToActivity)))
    ];
  
    return () => subscriptions.forEach(unsub => unsub());
  }, [currentUser]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id'>) => setNotifications(prev => [{ id: `notif-${Date.now()}`, ...notification }, ...prev]), []);
  const removeNotification = useCallback((id: string) => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  const addActivityLogEntry = useCallback(async (action: ActivityActionType, order: Pick<ServiceOrder, 'id' | 'orderNumber' | 'client'>, details?: string) => {
    if (!currentUser) return;
    const newEntry: Omit<ActivityLogEntry, 'id'> = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id, userName: currentUser.name, action,
      orderId: order.id, orderNumber: order.orderNumber, clientName: order.client, details,
    };
    await addDoc(collection(db, 'activityLog'), { ...newEntry, timestamp: Timestamp.fromDate(new Date(newEntry.timestamp)) });
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    setIsInitializing(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const message = error.code === 'auth/invalid-credential' ? 'Usuário ou senha inválidos.' : 'Ocorreu um erro ao fazer login.';
      setAuthError(message);
    } finally {
      setIsInitializing(false);
    }
  };

  const logout = () => { signOut(auth); };
  const fetchAllData = async () => { setInitializationError(null); }; // Retry is handled by useEffect re-triggering
  const clearFilters = useCallback(() => { setSearchTerm(''); setIsStalledFilterActive(false); }, []);

  const addOrder = async (orderData: Partial<ServiceOrder>) => {
    if (!currentUser || !orderData.orderNumber || !orderData.client) return;
    const now = Timestamp.fromDate(new Date());
    const newOrder = {
      ...orderData,
      status: OrderStatus.Waiting, progress: 0,
      thumbnailUrl: orderData.thumbnailUrl || `https://picsum.photos/seed/${orderData.client.replace(/\s+/g, '')}/400/300`,
      responsible: currentUser.name,
      creationDate: now, lastStatusUpdate: now,
      tasks: [], comments: [], files: [],
      expectedDeliveryDate: orderData.expectedDeliveryDate ? Timestamp.fromDate(new Date(orderData.expectedDeliveryDate)) : null,
    };
    const docRef = await addDoc(collection(db, 'orders'), newOrder);
    addNotification({ message: `Nova OS criada: ${orderData.client}`, type: NotificationColorType.Success, orderId: docRef.id });
    addActivityLogEntry(ActivityActionType.Create, { id: docRef.id, ...orderData } as ServiceOrder);
  };

  const updateOrder = async (updatedOrderData: Partial<ServiceOrder>) => {
    if (!updatedOrderData.id) return;
    const orderRef = doc(db, 'orders', updatedOrderData.id);
    const updateData = { ...updatedOrderData };
    delete updateData.id; // Don't try to write the id into the document
    await updateDoc(orderRef, updateData);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate || orderToUpdate.status === newStatus) return;
    const columnIndex = KANBAN_COLUMNS.findIndex(c => c.status === newStatus);
    const progress = Math.round((columnIndex / (KANBAN_COLUMNS.length - 1)) * 100);
    const updatedFields: Partial<ServiceOrder> = {
        id: orderId, status: newStatus, progress,
        lastStatusUpdate: new Date().toISOString(),
        ...(newStatus === OrderStatus.Delivered && !orderToUpdate.deliveryDate && { deliveryDate: new Date().toISOString() })
    };
    const details = `de '${orderToUpdate.status}' para '${newStatus}'`;
    await updateOrder({ ...updatedFields, lastStatusUpdate: Timestamp.fromDate(new Date(updatedFields.lastStatusUpdate!)) as any, deliveryDate: updatedFields.deliveryDate ? Timestamp.fromDate(new Date(updatedFields.deliveryDate)) as any : undefined });
    setRecentlyUpdatedOrderId(orderId);
    setTimeout(() => setRecentlyUpdatedOrderId(null), 2500);
    addNotification({ message: `OS ${orderToUpdate.orderNumber} movida para ${newStatus}.`, type: NotificationColorType.Success, orderId });
    addActivityLogEntry(ActivityActionType.Move, orderToUpdate, details);
  };

  const deleteOrder = async (orderId: string) => {
    if (currentUser?.role !== UserRole.Admin) return;
    const orderToDelete = orders.find(o => o.id === orderId);
    if (!orderToDelete) return;
    await deleteDoc(doc(db, 'orders', orderId));
    addNotification({ message: `OS ${orderToDelete.orderNumber} excluída.`, type: NotificationColorType.Warning });
    addActivityLogEntry(ActivityActionType.Delete, orderToDelete);
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    addNotification({ message: `A criação de usuários via app será implementada. Use o console do Firebase por enquanto.`, type: NotificationColorType.Warning });
  };
  const updateUser = async (updatedUserData: User) => {
    await updateDoc(doc(db, 'users', updatedUserData.id), { ...updatedUserData });
    addNotification({ message: `Usuário ${updatedUserData.name} atualizado.`, type: NotificationColorType.Success });
  };
  const deleteUser = async (userId: string) => {
    addNotification({ message: `A exclusão de usuários via app será implementada. Use o console do Firebase por enquanto.`, type: NotificationColorType.Warning });
  };

  const addTask = async (orderId: string, taskText: string) => {
    const newTask = { id: `task-${Date.now()}`, text: taskText, completed: false };
    await updateDoc(doc(db, 'orders', orderId), { tasks: arrayUnion(newTask) });
  };
  const updateTask = async (orderId: string, updatedTask: Task) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const updatedTasks = (order.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
    const completedTasks = updatedTasks.filter(t => t.completed).length;
    const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : order.progress;
    await updateDoc(doc(db, 'orders', orderId), { tasks: updatedTasks, progress });
  };
  const deleteTask = async (orderId: string, taskId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const taskToDelete = order.tasks?.find(t => t.id === taskId);
    if (taskToDelete) await updateDoc(doc(db, 'orders', orderId), { tasks: arrayRemove(taskToDelete) });
  };
  const addComment = async (orderId: string, commentText: string) => {
      if (!currentUser) return;
      const newComment = {
          id: `comment-${Date.now()}`, userId: currentUser.id, userName: currentUser.name,
          userPicture: currentUser.picture, text: commentText, timestamp: Timestamp.now()
      };
      await updateDoc(doc(db, 'orders', orderId), { comments: arrayUnion(newComment) });
      const order = orders.find(o => o.id === orderId);
      if (order) addActivityLogEntry(ActivityActionType.Comment, order, commentText);
  };
  const addFileToOrder = async (orderId: string, file: StoredFile) => await updateDoc(doc(db, 'orders', orderId), { files: arrayUnion(file) });
  const deleteFileFromOrder = async (orderId: string, file: StoredFile) => await updateDoc(doc(db, 'orders', orderId), { files: arrayRemove(file) });

  const deliveredOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.Delivered).sort((a,b) => (new Date(b.deliveryDate!).getTime() - new Date(a.deliveryDate!).getTime())), [orders]);
  const filteredOrders = useMemo(() => {
    let tempOrders = orders.filter(o => o.status !== OrderStatus.Delivered);
    if (isStalledFilterActive) {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        return tempOrders.filter(o => new Date(o.lastStatusUpdate) < twoDaysAgo);
    }
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return tempOrders.filter(o => o.client.toLowerCase().includes(lower) || o.orderNumber.toLowerCase().includes(lower) || o.status.toLowerCase().includes(lower));
    }
    return tempOrders;
  }, [orders, searchTerm, isStalledFilterActive]);

  const value = {
    orders, users, currentUser, activityLog, notifications, currentPage, searchTerm, isStalledFilterActive, recentlyUpdatedOrderId,
    isSummaryLoading: false, filteredOrders, deliveredOrders, isInitializing, isDataLoading, authError, initializationError,
    login, logout, fetchAllData, setCurrentPage, addOrder, updateOrder, deleteOrder, handleStatusChange, addNotification,
    removeNotification, setSearchTerm, setIsStalledFilterActive, clearFilters, addUser, updateUser, deleteUser,
    addTask, updateTask, deleteTask, addComment, addFileToOrder, deleteFileFromOrder
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
