import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { ServiceOrder, User, AppNotification, ActivityLogEntry, OrderStatus, UserRole, ActivityActionType, NotificationColorType } from '../types';
import { KANBAN_COLUMNS, USER_ROLES } from '../constants';
import { generateSummary } from '../services/geminiService';
import { initGoogleClient } from '../api/google';
import * as auth from '../api/auth';
import * as sheets from '../api/sheets';
import * as drive from '../api/drive';

// --- App Context Interfaces ---
interface AppContextType {
  orders: ServiceOrder[];
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
  
  login: () => void;
  logout: () => void;
  setCurrentPage: (page: string) => void;
  addOrder: (newOrderData: Omit<ServiceOrder, 'id' | 'status' | 'progress' | 'lastStatusUpdate' | 'creationDate'>) => Promise<void>;
  updateOrder: (updatedOrderData: ServiceOrder) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  handleStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setIsStalledFilterActive: (isActive: boolean) => void;
  clearFilters: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStalledFilterActive, setIsStalledFilterActive] = useState(false);
  const [recentlyUpdatedOrderId, setRecentlyUpdatedOrderId] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // --- Core Functions ---

  const addNotification = useCallback((notification: Omit<AppNotification, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [{ id, ...notification }, ...prev]);
  }, []);

  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  
  const addActivityLogEntry = useCallback(async (
    action: ActivityActionType,
    order: Pick<ServiceOrder, 'id' | 'orderNumber' | 'client'>,
    details?: string
  ) => {
    if (!currentUser) return;
    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action, orderId: order.id, orderNumber: order.orderNumber, clientName: order.client, details,
    };
    setActivityLog(prev => [newEntry, ...prev]);
    await sheets.addActivityLogEntry(newEntry);
  }, [currentUser]);


  // --- Data Fetching and Initialization ---

  const fetchAllData = useCallback(async () => {
    setIsDataLoading(true);
    try {
        const [fetchedOrders, fetchedLogs] = await Promise.all([
            sheets.getOrders(),
            sheets.getActivityLog()
        ]);
        setOrders(fetchedOrders);
        setActivityLog(fetchedLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setAuthError("Erro ao carregar dados. Verifique as permissões da planilha.");
    } finally {
        setIsDataLoading(false);
    }
  }, []);

  const handleTokenResponse = useCallback(async (tokenResponse: any) => {
    if (tokenResponse.error) {
        console.error("Token error:", tokenResponse.error);
        setAuthError("Falha na autenticação. Por favor, tente novamente.");
        setIsInitializing(false);
        return;
    }

    if (window.gapi) {
      window.gapi.client.setToken({ access_token: tokenResponse.access_token });
    }
    
    try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
        });
        if (!userInfoResponse.ok) throw new Error('Failed to fetch user info');
        
        const profile = await userInfoResponse.json();
        const userRole = USER_ROLES[profile.email.toLowerCase()] || UserRole.Viewer;

        if (userRole === UserRole.Viewer) {
            setAuthError("Acesso não autorizado. Contate o administrador.");
             auth.signOut();
             setIsInitializing(false);
             return;
        }

        setCurrentUser({
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
            role: userRole,
        });
        
        await fetchAllData();
        
    } catch (error) {
        console.error("Error fetching user profile:", error);
        setAuthError("Não foi possível obter informações do perfil.");
    }
  }, [fetchAllData]);

  useEffect(() => {
    const initialize = async () => {
        setIsInitializing(true);
        try {
            await initGoogleClient(handleTokenResponse);
            setIsInitializing(false);
        } catch (error) {
            console.error("Initialization failed:", error);
            setAuthError("Não foi possível conectar aos serviços do Google.");
            setIsInitializing(false);
        }
    };
    initialize();
  }, [handleTokenResponse]);

  // --- Auth Functions ---

  const login = () => {
    setAuthError(null);
    auth.signIn();
  };

  const logout = () => {
    auth.signOut();
    setCurrentUser(null);
    setOrders([]);
    setActivityLog([]);
  };
  
  // --- UI and Filter Functions ---
  
  const clearFilters = () => {
    setSearchTerm('');
    setIsStalledFilterActive(false);
  };
  
  // --- CRUD Operations ---
  
  const addOrder = async (orderData: Omit<ServiceOrder, 'id' | 'status' | 'progress' | 'lastStatusUpdate' | 'creationDate'>) => {
    if (!currentUser || currentUser.role === UserRole.Viewer) return;
    setIsDataLoading(true);
    
    try {
        // 1. Create a folder in Google Drive
        const folderName = `${orderData.orderNumber}_${orderData.client}`;
        const folder = await drive.createFolder(folderName);

        // 2. Prepare the full order object
        const now = new Date().toISOString();
        const newOrder: ServiceOrder = {
            ...orderData, 
            id: orderData.orderNumber, // Use OS number as unique ID
            status: OrderStatus.Waiting, 
            progress: 0,
            link: folder.webViewLink,
            responsible: currentUser.name,
            lastStatusUpdate: now, 
            creationDate: now,
        };

        // 3. Add to Google Sheets
        await sheets.addOrder(newOrder);

        // 4. Update local state
        setOrders(prev => [...prev, newOrder]);
        
        addNotification({ message: `Nova OS criada: ${newOrder.client}`, type: NotificationColorType.Success, orderId: newOrder.id });
        addActivityLogEntry(ActivityActionType.Create, newOrder);
        
    } catch (error) {
        console.error("Failed to add order:", error);
        addNotification({ message: 'Erro ao criar a OS', details: 'Verifique o console para mais informações.', type: NotificationColorType.Alert });
    } finally {
        setIsDataLoading(false);
    }
  };

  const updateOrder = async (updatedOrderData: ServiceOrder) => {
    if (!currentUser || currentUser.role === UserRole.Viewer) return;
    const originalOrder = orders.find(o => o.id === updatedOrderData.id);
    if (!originalOrder) return;
    
    const hasStatusChanged = originalOrder.status !== updatedOrderData.status;
    const updatedOrder = {
        ...updatedOrderData,
        lastStatusUpdate: hasStatusChanged ? new Date().toISOString() : updatedOrderData.lastStatusUpdate
    };
    
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setRecentlyUpdatedOrderId(updatedOrder.id);
    setTimeout(() => setRecentlyUpdatedOrderId(null), 2500);

    try {
        await sheets.updateOrder(updatedOrder);

        if (hasStatusChanged) {
            const details = `de '${originalOrder.status}' para '${updatedOrder.status}'`;
            const action = updatedOrder.status === OrderStatus.Delivered ? ActivityActionType.Complete : ActivityActionType.Move;
            addActivityLogEntry(action, updatedOrder, details);
        } else {
            addActivityLogEntry(ActivityActionType.Update, updatedOrder);
        }
         addNotification({ message: `OS ${updatedOrder.orderNumber} atualizada.`, type: NotificationColorType.Success, orderId: updatedOrder.id });
    } catch (error) {
        console.error("Failed to update order:", error);
        // Revert UI on failure
        setOrders(prev => prev.map(o => o.id === originalOrder.id ? originalOrder : o));
        addNotification({ message: 'Erro ao atualizar OS', type: NotificationColorType.Alert });
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser || currentUser.role === UserRole.Viewer) return;
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate || orderToUpdate.status === newStatus) return;

    const columnIndex = KANBAN_COLUMNS.findIndex(c => c.status === newStatus);
    const progress = Math.round((columnIndex / (KANBAN_COLUMNS.length - 1)) * 100);

    const updatedOrder: ServiceOrder = {
        ...orderToUpdate,
        status: newStatus,
        progress: progress,
        lastStatusUpdate: new Date().toISOString(),
        ...(newStatus === OrderStatus.Delivered && { deliveryDate: new Date().toISOString() })
    };

    await updateOrder(updatedOrder);
  };

  const deleteOrder = async (orderId: string) => {
    if (currentUser?.role !== UserRole.Admin) return;
    const orderToDelete = orders.find(o => o.id === orderId);
    if (!orderToDelete || !orderToDelete._rowIndex) return;

    // Optimistic UI update
    const originalOrders = orders;
    setOrders(prev => prev.filter(o => o.id !== orderId));
    
    try {
        await sheets.deleteOrder(orderToDelete._rowIndex);
        addNotification({ message: `OS ${orderToDelete.orderNumber} excluída.`, type: NotificationColorType.Warning });
        addActivityLogEntry(ActivityActionType.Delete, orderToDelete);
    } catch (error) {
        console.error("Failed to delete order:", error);
        setOrders(originalOrders); // Revert on failure
        addNotification({ message: 'Erro ao excluir a OS.', type: NotificationColorType.Alert });
    }
  };

  // --- Memoized Values ---

  const deliveredOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.Delivered).sort((a,b) => new Date(b.deliveryDate!).getTime() - new Date(a.deliveryDate!).getTime()), [orders]);
  
  const filteredOrders = useMemo(() => {
     let tempOrders = [...orders];

    if (isStalledFilterActive) {
        const twoDaysAgo = new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000));
        tempOrders = tempOrders.filter(o => 
            o.status !== OrderStatus.Delivered && new Date(o.lastStatusUpdate) < twoDaysAgo
        );
    } else if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        tempOrders = tempOrders.filter(o =>
            o.client.toLowerCase().includes(lowercasedTerm) ||
            o.orderNumber.toLowerCase().includes(lowercasedTerm) ||
            o.status.toLowerCase().includes(lowercasedTerm)
        );
    }
    
    return tempOrders.filter(o => o.status !== OrderStatus.Delivered);
  }, [orders, searchTerm, isStalledFilterActive]);


  const value: AppContextType = {
    orders, currentUser, activityLog, notifications, currentPage, searchTerm,
    isStalledFilterActive, recentlyUpdatedOrderId, isSummaryLoading, filteredOrders,
    deliveredOrders, isInitializing, isDataLoading, authError,
    login, logout, setCurrentPage, addOrder, updateOrder, deleteOrder,
    handleStatusChange, addNotification, removeNotification,
    setSearchTerm, setIsStalledFilterActive, clearFilters,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
