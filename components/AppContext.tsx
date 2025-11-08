import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { ServiceOrder, User, AppNotification, ActivityLogEntry, OrderStatus, UserRole, ActivityActionType, NotificationColorType, Task, Comment, CommercialQuote, QuoteStatus, CatalogServiceItem, KanbanFilters, KanbanView, KanbanColumn, CustomFieldDefinition, ProofImage, ProofComment, Invoice, InvoiceStatus, FixedCost, VariableCost, RevenueEntry, ChatChannel, ChatMessage, ChannelType, ChatAttachment, Priority } from '../types';
import { DEFAULT_KANBAN_COLUMNS, DEFAULT_CUSTOM_FIELDS } from '../constants';
import { MOCK_USERS, MOCK_ORDERS, MOCK_ACTIVITY_LOG, MOCK_QUOTES, MOCK_CATALOG_SERVICES, MOCK_FIXED_COSTS, MOCK_VARIABLE_COSTS, MOCK_REVENUE_ENTRIES, MOCK_CHAT_CHANNELS, MOCK_CHAT_MESSAGES } from '../mockData'; // Import mock data

interface TypingIndicator {
  userName: string;
  timestamp: number;
}

// --- App Context Interfaces ---
interface AppContextType {
  orders: ServiceOrder[];
  quotes: CommercialQuote[];
  users: User[];
  catalogServices: CatalogServiceItem[];
  currentUser: User | null;
  activityLog: ActivityLogEntry[];
  notifications: AppNotification[];
  currentPage: string;
  recentlyUpdatedOrderId: string | null;
  isSummaryLoading: boolean;
  filteredOrders: ServiceOrder[];
  deliveredOrders: ServiceOrder[];
  isInitializing: boolean;
  isDataLoading: boolean;
  authError: string | null;

  // Financial Data
  fixedCosts: FixedCost[];
  variableCosts: VariableCost[];
  revenueEntries: RevenueEntry[];

  // Chat Data
  channels: ChatChannel[];
  messages: ChatMessage[];
  typingStatus: Record<string, TypingIndicator[]>;


  // Kanban Columns
  kanbanColumns: KanbanColumn[];
  setKanbanColumns: (columns: KanbanColumn[]) => void;
  // Custom Fields
  customFieldDefinitions: CustomFieldDefinition[];
  setCustomFieldDefinitions: (definitions: CustomFieldDefinition[]) => void;

  // New Filter State
  kanbanFilters: KanbanFilters;
  kanbanViews: KanbanView[];
  
  login: (email: string, password: string) => void;
  logout: () => void;
  setCurrentPage: (page: string) => void;
  addOrder: (newOrderData: Partial<ServiceOrder>) => Promise<void>;
  updateOrder: (updatedOrderData: ServiceOrder) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  handleStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  
  // New Filter Handlers
  updateKanbanFilters: (newFilters: Partial<KanbanFilters>) => void;
  saveKanbanView: (name: string) => void;
  applyKanbanView: (viewId: string) => void;
  deleteKanbanView: (viewId: string) => void;
  clearFilters: () => void; // Added for Daily Summary
  setIsStalledFilterActive: (isActive: boolean) => void; // Added for Daily Summary

  
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  // New functions for tasks and comments
  addTask: (orderId: string, taskText: string) => Promise<void>;
  updateTask: (orderId: string, updatedTask: Task) => Promise<void>;
  deleteTask: (orderId: string, taskId: string) => Promise<void>;
  addComment: (orderId: string, commentText: string) => Promise<void>;
  // New functions for quotes
  addQuote: (quoteData: Omit<CommercialQuote, 'id' | 'value'>) => Promise<void>;
  updateQuote: (updatedQuote: CommercialQuote) => Promise<void>;
  deleteQuote: (quoteId: string) => Promise<void>;
  // New functions for catalog
  addCatalogService: (service: Omit<CatalogServiceItem, 'id'>) => Promise<void>;
  updateCatalogService: (service: CatalogServiceItem) => Promise<void>;
  deleteCatalogService: (serviceId: string) => Promise<void>;
  // Client Portal
  generateShareableLink: (orderId: string) => Promise<string>;
  // Proofing
  addProofComment: (orderId: string, imageId: string, commentData: Omit<ProofComment, 'id'|'timestamp'|'resolved'>) => Promise<void>;
  // Invoicing
  generateInvoice: (orderId: string) => Promise<void>;
  updateInvoiceStatus: (orderId: string, status: InvoiceStatus) => Promise<void>;

  // Financial CRUD
  addFixedCost: (cost: Omit<FixedCost, 'id'>) => Promise<void>;
  updateFixedCost: (cost: FixedCost) => Promise<void>;
  deleteFixedCost: (costId: string) => Promise<void>;
  addVariableCost: (cost: Omit<VariableCost, 'id'>) => Promise<void>;
  updateVariableCost: (cost: VariableCost) => Promise<void>;
  deleteVariableCost: (costId: string) => Promise<void>;
  addRevenueEntry: (entry: Omit<RevenueEntry, 'id'>) => Promise<void>;
  updateRevenueEntry: (entry: RevenueEntry) => Promise<void>;
  deleteRevenueEntry: (entryId: string) => Promise<void>;
  
  // Chat Functions
  sendMessage: (channelId: string, text: string, attachmentFile?: File, replyTo?: string) => Promise<void>;
  createChannel: (name: string, members: string[], type: ChannelType) => Promise<string | null>;
  toggleReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  setUserTyping: (channelId: string) => void;

}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [quotes, setQuotes] = useState<CommercialQuote[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS); // Initialize with mock users for auth check
  const [catalogServices, setCatalogServices] = useState<CatalogServiceItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentPage, setCurrentPage] = useState('Produção');
  const [recentlyUpdatedOrderId, setRecentlyUpdatedOrderId] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  const [isInitializing, setIsInitializing] = useState(false); // Used for login loading state
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // --- Financial State ---
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);

  // --- Chat State ---
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingStatus, setTypingStatus] = useState<Record<string, TypingIndicator[]>>({});


  // --- State for Kanban Columns ---
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(() => {
    try {
      const savedColumns = localStorage.getItem('dz-kanban-columns');
      return savedColumns ? JSON.parse(savedColumns) : DEFAULT_KANBAN_COLUMNS;
    } catch {
      return DEFAULT_KANBAN_COLUMNS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dz-kanban-columns', JSON.stringify(kanbanColumns));
    } catch (error) {
      console.error("Failed to save columns to localStorage:", error);
    }
  }, [kanbanColumns]);

  // --- State for Custom Fields ---
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>(() => {
    try {
        const savedDefs = localStorage.getItem('dz-custom-fields');
        const parsed = savedDefs ? JSON.parse(savedDefs) : null;
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CUSTOM_FIELDS;
    } catch {
        return DEFAULT_CUSTOM_FIELDS;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem('dz-custom-fields', JSON.stringify(customFieldDefinitions));
    } catch (error) {
        console.error("Failed to save custom field definitions to localStorage:", error);
    }
  }, [customFieldDefinitions]);

  // --- State for Kanban Filters ---
  const [kanbanFilters, setKanbanFilters] = useState<KanbanFilters>({});
  const [kanbanViews, setKanbanViews] = useState<KanbanView[]>([]);
  const [isStalledFilterActive, setIsStalledFilterActive] = useState(false);


  useEffect(() => {
    try {
      const savedViews = localStorage.getItem('dz-kanban-views');
      if (savedViews) {
        setKanbanViews(JSON.parse(savedViews));
      }
    } catch (error) {
      console.error("Failed to load saved views from localStorage:", error);
    }
  }, []);
  
  // --- Core Functions (Local State) ---

  const addNotification = useCallback((notification: Omit<AppNotification, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [{ id, ...notification }, ...prev]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const addActivityLogEntry = useCallback((
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
  }, [currentUser]);


  // --- [MOCK] Auth Functions ---
  const login = useCallback((email: string, password: string) => {
    setIsInitializing(true);
    setAuthError(null);

    setTimeout(() => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            console.log(`[MOCK] Login successful for ${user.name}`);
            setCurrentUser(user);
            setOrders(MOCK_ORDERS);
            setActivityLog(MOCK_ACTIVITY_LOG);
            setQuotes(MOCK_QUOTES);
            setCatalogServices(MOCK_CATALOG_SERVICES);
            setFixedCosts(MOCK_FIXED_COSTS);
            setVariableCosts(MOCK_VARIABLE_COSTS);
            setRevenueEntries(MOCK_REVENUE_ENTRIES);
            
            // Load chat data from localStorage or initialize with mock data
            try {
                const savedChannels = localStorage.getItem('dz-chat-channels');
                const savedMessages = localStorage.getItem('dz-chat-messages');
                if (savedChannels && savedMessages) {
                    setChannels(JSON.parse(savedChannels));
                    setMessages(JSON.parse(savedMessages));
                } else {
                    setChannels(MOCK_CHAT_CHANNELS);
                    setMessages(MOCK_CHAT_MESSAGES);
                    localStorage.setItem('dz-chat-channels', JSON.stringify(MOCK_CHAT_CHANNELS));
                    localStorage.setItem('dz-chat-messages', JSON.stringify(MOCK_CHAT_MESSAGES));
                }
            } catch (e) {
                console.error("Failed to load/save chat data from/to localStorage", e);
                setChannels(MOCK_CHAT_CHANNELS);
                setMessages(MOCK_CHAT_MESSAGES);
            }

        } else {
            console.log("[MOCK] Login failed: Invalid credentials");
            setAuthError("Usuário ou senha inválidos.");
        }
        setIsInitializing(false);
    }, 1000); // Simulate network delay
  }, [users]);


  const logout = useCallback(() => {
    console.log("[MOCK] Logging out.");

    // Persist group chat history in localStorage
    try {
        const savedChannelsRaw = localStorage.getItem('dz-chat-channels');
        const savedMessagesRaw = localStorage.getItem('dz-chat-messages');

        if (savedChannelsRaw && savedMessagesRaw) {
            const allChannels: ChatChannel[] = JSON.parse(savedChannelsRaw);
            const allMessages: ChatMessage[] = JSON.parse(savedMessagesRaw);

            const groupChannels = allChannels.filter(c => c.type === ChannelType.Group);
            const groupChannelIds = new Set(groupChannels.map(c => c.id));
            const groupMessages = allMessages.filter(m => groupChannelIds.has(m.channelId));

            localStorage.setItem('dz-chat-channels', JSON.stringify(groupChannels));
            localStorage.setItem('dz-chat-messages', JSON.stringify(groupMessages));
        } else {
            // Ensure localStorage is clean if it was empty or inconsistent
            localStorage.removeItem('dz-chat-channels');
            localStorage.removeItem('dz-chat-messages');
        }
    } catch (e) {
        console.error("Failed to process chat history on logout:", e);
        // If parsing fails, clear everything to prevent a corrupted state on next login
        localStorage.removeItem('dz-chat-channels');
        localStorage.removeItem('dz-chat-messages');
    }

    setCurrentUser(null);
    setOrders([]);
    setActivityLog([]);
    setQuotes([]);
    setCatalogServices([]);
    setFixedCosts([]);
    setVariableCosts([]);
    setRevenueEntries([]);
    setChannels([]);
    setMessages([]);
    // Keep the list of users so we can log back in
  }, []);
  

  // --- MOCK Calendar Sync ---
  const syncOrderToCalendar = useCallback((order: ServiceOrder, action: 'create' | 'update' | 'delete') => {
    if (!order.expectedDeliveryDate || !order.responsible) {
        console.log(`[MOCK CALENDAR SYNC] Skipped for OS ${order.orderNumber}: missing date or responsible.`);
        return;
    }

    const event = {
        summary: `Entrega OS: ${order.orderNumber} - ${order.client}`,
        description: order.description,
        start: { date: order.expectedDeliveryDate.split('T')[0] },
        end: { date: order.expectedDeliveryDate.split('T')[0] },
        attendees: [{ email: users.find(u => u.name === order.responsible)?.email }]
    };
    
    console.log(`[MOCK CALENDAR SYNC] Event to ${action}:`, event);
    addNotification({
        message: `Simulando sincronia com calendário...`,
        details: `Ação: ${action} para OS ${order.orderNumber}`,
        type: NotificationColorType.Success
    });
  }, [users, addNotification]);

  
  // --- [MOCK] CRUD Operations ---
  
  const addOrder = useCallback(async (orderData: Partial<ServiceOrder>) => {
    if (!currentUser || !orderData.orderNumber || !orderData.client) return;
    setIsDataLoading(true);

    await new Promise<void>(resolve => {
      setTimeout(() => { // Simulate network delay
        const now = new Date().toISOString();
        const firstStatus = kanbanColumns[0]?.status || 'Aguardando produto';
        const newOrder: ServiceOrder = {
            id: `OS-MOCK-${Date.now()}`,
            orderNumber: orderData.orderNumber!,
            client: orderData.client!,
            description: orderData.description || '',
            thumbnailUrl: orderData.thumbnailUrl || `https://picsum.photos/seed/${orderData.client!.replace(/\s+/g, '')}/400/300`,
            imageCount: orderData.imageCount || 0,
            status: firstStatus, 
            progress: 0,
            link: '#', // Mock link
            responsible: currentUser.name,
            lastStatusUpdate: now, 
            creationDate: now,
            value: orderData.value || 0,
            costs: orderData.costs || 0,
            tasks: [],
            comments: [],
            customFields: orderData.customFields || {},
            _rowIndex: orders.length + 2,
            priority: orderData.priority || 'Média',
            ...(orderData.expectedDeliveryDate && {expectedDeliveryDate: orderData.expectedDeliveryDate})
        };
        
        setOrders(prev => [...prev, newOrder]);
        addNotification({ message: `Nova OS criada: ${newOrder.client}`, type: NotificationColorType.Success, orderId: newOrder.id });
        addActivityLogEntry(ActivityActionType.Create, newOrder);
        syncOrderToCalendar(newOrder, 'create');
        setIsDataLoading(false);
        resolve();
      }, 500);
    });
  }, [currentUser, orders, addNotification, addActivityLogEntry, syncOrderToCalendar, kanbanColumns]);

  const updateOrder = useCallback(async (updatedOrderData: ServiceOrder) => {
    if (!currentUser) return;
    
    const originalOrder = orders.find(o => o.id === updatedOrderData.id);
    if (!originalOrder) return;
    
    const hasStatusChanged = originalOrder.status !== updatedOrderData.status;

    const updatedOrder = {
        ...updatedOrderData,
        lastStatusUpdate: new Date().toISOString()
    };
    
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    if (
        originalOrder.expectedDeliveryDate !== updatedOrder.expectedDeliveryDate ||
        originalOrder.responsible !== updatedOrder.responsible
    ) {
        syncOrderToCalendar(updatedOrder, 'update');
    }

    if (hasStatusChanged) {
        const originalColumn = kanbanColumns.find(c => c.status === originalOrder.status);
        const newColumn = kanbanColumns.find(c => c.status === updatedOrder.status);
        const details = `de '${originalColumn?.title || originalOrder.status}' para '${newColumn?.title || updatedOrder.status}'`;
        const action = updatedOrder.status === 'Entregue' ? ActivityActionType.Complete : ActivityActionType.Move;
        addActivityLogEntry(action, updatedOrder, details);
    } else {
        addActivityLogEntry(ActivityActionType.Update, updatedOrder);
    }
    
    // Simulate API call for backend persistence
    await new Promise(resolve => setTimeout(resolve, 300));

  }, [currentUser, orders, addActivityLogEntry, syncOrderToCalendar, kanbanColumns]);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate || orderToUpdate.status === newStatus) return;

    const deliveredColumn = kanbanColumns.find(c => c.status === 'Entregue');
    const columnsForProgress = kanbanColumns.filter(c => c.status !== 'Entregue');
    const columnIndex = columnsForProgress.findIndex(c => c.status === newStatus);

    let progress = 0;
    if (newStatus === 'Entregue') {
      progress = 100;
    } else if (columnIndex !== -1 && columnsForProgress.length > 0) {
      progress = Math.round(((columnIndex + 1) / columnsForProgress.length) * 99);
    }

    const updatedOrder: ServiceOrder = {
        ...orderToUpdate,
        status: newStatus,
        progress: progress,
        lastStatusUpdate: new Date().toISOString(),
        ...(newStatus === 'Entregue' && !orderToUpdate.deliveryDate && { deliveryDate: new Date().toISOString() })
    };
    
    await updateOrder(updatedOrder);
    setRecentlyUpdatedOrderId(updatedOrder.id);
    setTimeout(() => setRecentlyUpdatedOrderId(null), 2500);
    const newColumn = kanbanColumns.find(c => c.status === newStatus);
    addNotification({ message: `OS ${updatedOrder.orderNumber} movida para ${newColumn?.title || newStatus}.`, type: NotificationColorType.Success, orderId: updatedOrder.id });
  }, [orders, updateOrder, addNotification, kanbanColumns]);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (currentUser?.role !== UserRole.Admin) return;
    
    await new Promise<void>(resolve => {
        setTimeout(() => {
            const orderToDelete = orders.find(o => o.id === orderId);
            if (orderToDelete) {
                syncOrderToCalendar(orderToDelete, 'delete');
                setOrders(prev => prev.filter(o => o.id !== orderId));
                addNotification({ message: `OS ${orderToDelete.orderNumber} excluída.`, type: NotificationColorType.Warning });
                addActivityLogEntry(ActivityActionType.Delete, orderToDelete);
            }
            resolve();
        }, 500);
    });
  }, [currentUser, orders, addNotification, addActivityLogEntry, syncOrderToCalendar]);

  const addComment = useCallback(async (orderId: string, commentText: string) => {
      if (!currentUser) return;
      
      await new Promise<void>(resolve => {
        setTimeout(() => {
            const order = orders.find(o => o.id === orderId);
            if (!order) return resolve();

            const mentionRegex = /@([\w\s()]+)/g;
            const mentions = [...commentText.matchAll(mentionRegex)];

            if (mentions.length > 0) {
                mentions.forEach(match => {
                    const userName = match[1].trim();
                    const mentionedUser = users.find(u => u.name === userName);
                    if (mentionedUser && mentionedUser.id !== currentUser.id) {
                        addNotification({
                            message: `${currentUser.name} mencionou você.`,
                            details: `Na OS ${order.orderNumber}: "${commentText.substring(0, 50)}..."`,
                            type: NotificationColorType.Warning,
                            orderId,
                        });
                    }
                });
            }

            setOrders(prevOrders => prevOrders.map(o => {
                if (o.id === orderId) {
                    const newComment: Comment = {
                        id: `comment-${Date.now()}`,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userPicture: currentUser.picture,
                        text: commentText,
                        timestamp: new Date().toISOString(),
                    };
                    const updatedComments = [...(o.comments || []), newComment];
                    return { ...o, comments: updatedComments, lastStatusUpdate: new Date().toISOString() };
                }
                return o;
            }));
            
            addActivityLogEntry(ActivityActionType.Comment, order, commentText);
            resolve();
        }, 300);
      });
  }, [currentUser, users, orders, addActivityLogEntry, addNotification]);

  // --- Filter Management ---
  const updateKanbanFilters = useCallback((newFilters: Partial<KanbanFilters>) => {
    setIsStalledFilterActive(false); // Any new filter change disables the stalled filter
    setKanbanFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setKanbanFilters({});
    setIsStalledFilterActive(false);
  }, []);


  const saveKanbanView = useCallback((name: string) => {
    const newView: KanbanView = { id: `view-${Date.now()}`, name, filters: kanbanFilters };
    const updatedViews = [...kanbanViews, newView];
    setKanbanViews(updatedViews);
    localStorage.setItem('dz-kanban-views', JSON.stringify(updatedViews));
    addNotification({ message: `Visão "${name}" salva.`, type: NotificationColorType.Success });
  }, [kanbanFilters, kanbanViews, addNotification]);

  const applyKanbanView = useCallback((viewId: string) => {
    if (viewId === 'default') {
      clearFilters();
      return;
    }
    const view = kanbanViews.find(v => v.id === viewId);
    if (view) {
      setKanbanFilters(view.filters);
    }
  }, [kanbanViews, clearFilters]);

  const deleteKanbanView = useCallback((viewId: string) => {
    const updatedViews = kanbanViews.filter(v => v.id !== viewId);
    setKanbanViews(updatedViews);
    localStorage.setItem('dz-kanban-views', JSON.stringify(updatedViews));
  }, [kanbanViews]);
  
  // --- Memoized Values ---
  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'Entregue').sort((a,b) => {
      const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
      const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
      return dateB - dateA;
  }), [orders]);
  
  const filteredOrders = useMemo(() => {
     let tempOrders = orders.filter(o => o.status !== 'Entregue');

     if (isStalledFilterActive) {
        const twoDaysAgo = new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000));
        return tempOrders.filter(o => new Date(o.lastStatusUpdate) < twoDaysAgo);
     }

     if (Object.keys(kanbanFilters).length > 0) {
        tempOrders = tempOrders.filter(o => {
            const { searchTerm, client, responsible, startDate, endDate, priority } = kanbanFilters;

            if (searchTerm) {
                const lowercasedTerm = searchTerm.toLowerCase();
                if (
                    !o.client.toLowerCase().includes(lowercasedTerm) &&
                    !o.orderNumber.toLowerCase().includes(lowercasedTerm) &&
                    !o.status.toLowerCase().includes(lowercasedTerm)
                ) return false;
            }

            if (client && o.client !== client) return false;
            if (responsible && o.responsible !== responsible) return false;
            if (priority && o.priority !== priority) return false;

            if (startDate && o.expectedDeliveryDate) {
                if (new Date(o.expectedDeliveryDate) < new Date(startDate)) return false;
            }
            if (endDate && o.expectedDeliveryDate) {
                // Add 1 day to endDate to make it inclusive
                const inclusiveEndDate = new Date(endDate);
                inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
                if (new Date(o.expectedDeliveryDate) >= inclusiveEndDate) return false;
            }

            return true;
        });
     }
    
    return tempOrders;
  }, [orders, kanbanFilters, isStalledFilterActive]);

  const addTask = useCallback(async (orderId: string, taskText: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    await new Promise<void>(resolve => {
      setTimeout(() => {
        setOrders(prevOrders =>
          prevOrders.map(o => {
            if (o.id === orderId) {
              const newTask: Task = { id: `task-${Date.now()}`, text: taskText, completed: false };
              const updatedTasks = [...(o.tasks || []), newTask];
              return { ...o, tasks: updatedTasks, lastStatusUpdate: new Date().toISOString() };
            }
            return o;
          }),
        );
        addActivityLogEntry(ActivityActionType.TaskAdd, order, taskText);
        resolve();
      }, 300);
    });
  }, [orders, addActivityLogEntry]);

  const updateTask = useCallback(async (orderId: string, updatedTask: Task) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    await new Promise<void>(resolve => {
      setTimeout(() => {
        setOrders(prevOrders =>
          prevOrders.map(o => {
            if (o.id === orderId) {
              const updatedTasks = (o.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
              const completedTasks = updatedTasks.filter(t => t.completed).length;
              const totalTasks = updatedTasks.length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : o.progress;
              if (updatedTask.completed) {
                  const originalTask = o.tasks?.find(t => t.id === updatedTask.id);
                  if (originalTask && !originalTask.completed) {
                    addActivityLogEntry(ActivityActionType.TaskComplete, order, updatedTask.text);
                  }
              }
              return { ...o, tasks: updatedTasks, progress, lastStatusUpdate: new Date().toISOString() };
            }
            return o;
          }),
        );
        resolve();
      }, 300);
    });
  }, [orders, addActivityLogEntry]);
  
  const deleteTask = useCallback(async (orderId: string, taskId: string) => {
      await new Promise<void>(resolve => {
        setTimeout(() => {
            setOrders(prevOrders => prevOrders.map(o => {
                if (o.id === orderId) {
                    const updatedTasks = (o.tasks || []).filter(t => t.id !== taskId);
                    return { ...o, tasks: updatedTasks, lastStatusUpdate: new Date().toISOString() };
                }
                return o;
            }));
            resolve();
        }, 300);
      });
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    setIsDataLoading(true);
    await new Promise<void>(resolve => {
      setTimeout(() => {
        const newUser: User = {
            ...userData,
            id: `user-${Date.now()}`,
            picture: userData.picture || `https://i.pravatar.cc/150?u=${userData.email}`
        };
        setUsers(prev => [...prev, newUser]);
        addNotification({ message: `Usuário ${newUser.name} criado com sucesso.`, type: NotificationColorType.Success });
        setIsDataLoading(false);
        resolve();
      }, 500);
    });
  }, [addNotification]);
  
  const updateUser = useCallback(async (updatedUserData: User) => {
    setIsDataLoading(true);
    await new Promise<void>(resolve => {
      setTimeout(() => {
        setUsers(prev => prev.map(u => u.id === updatedUserData.id ? updatedUserData : u));
        addNotification({ message: `Usuário ${updatedUserData.name} atualizado.`, type: NotificationColorType.Success });
        setIsDataLoading(false);
        resolve();
      }, 500);
    });
  }, [addNotification]);

  const deleteUser = useCallback(async (userId: string) => {
      setIsDataLoading(true);
      await new Promise<void>(resolve => {
          setTimeout(() => {
              const userToDelete = users.find(u => u.id === userId);
              if (userToDelete) {
                  setUsers(prev => prev.filter(u => u.id !== userId));
                  addNotification({ message: `Usuário ${userToDelete.name} excluído.`, type: NotificationColorType.Warning });
              }
              setIsDataLoading(false);
              resolve();
          }, 500);
      });
  }, [users, addNotification]);

  const calculateQuoteValue = (quoteData: Omit<CommercialQuote, 'id' | 'value'>): number => {
    const subtotal = quoteData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    if (quoteData.discountType === 'percentage') {
      return subtotal * (1 - (quoteData.discountValue || 0) / 100);
    }
    return subtotal - (quoteData.discountValue || 0);
  };

  const addQuote = useCallback(async (quoteData: Omit<CommercialQuote, 'id' | 'value'>) => {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        const newQuote: CommercialQuote = {
          id: `Q-MOCK-${Date.now()}`,
          ...quoteData,
          value: calculateQuoteValue(quoteData),
        };
        setQuotes(prev => [newQuote, ...prev]);
        addNotification({ message: `Orçamento ${newQuote.quoteNumber} criado com sucesso.`, type: NotificationColorType.Success });
        resolve();
      }, 500);
    });
  }, [addNotification]);

  const updateQuote = useCallback(async (updatedQuote: CommercialQuote) => {
    await new Promise<void>(resolve => {
        setTimeout(() => {
            const quoteWithCalculatedValue = {
                ...updatedQuote,
                value: calculateQuoteValue(updatedQuote)
            };
            setQuotes(prev => prev.map(q => q.id === quoteWithCalculatedValue.id ? quoteWithCalculatedValue : q));
            addNotification({ message: `Orçamento ${quoteWithCalculatedValue.quoteNumber} atualizado.`, type: NotificationColorType.Success });
            resolve();
        }, 500);
    });
  }, [addNotification]);

  const deleteQuote = useCallback(async (quoteId: string) => {
    await new Promise<void>(resolve => {
        setTimeout(() => {
            const quoteToDelete = quotes.find(q => q.id === quoteId);
            if (quoteToDelete) {
                setQuotes(prev => prev.filter(q => q.id !== quoteId));
                addNotification({ message: `Orçamento ${quoteToDelete.quoteNumber} excluído.`, type: NotificationColorType.Warning });
            }
            resolve();
        }, 500);
    });
  }, [quotes, addNotification]);

  const addCatalogService = useCallback(async (serviceData: Omit<CatalogServiceItem, 'id'>) => {
      setIsDataLoading(true);
      await new Promise<void>(resolve => {
        setTimeout(() => {
            const newService: CatalogServiceItem = {
                ...serviceData,
                id: `cat-${Date.now()}`,
            };
            setCatalogServices(prev => [newService, ...prev]);
            addNotification({ message: `Serviço "${newService.title}" adicionado ao catálogo.`, type: NotificationColorType.Success });
            setIsDataLoading(false);
            resolve();
        }, 500);
      });
  }, [addNotification]);

  const updateCatalogService = useCallback(async (updatedService: CatalogServiceItem) => {
      setIsDataLoading(true);
      await new Promise<void>(resolve => {
        setTimeout(() => {
            setCatalogServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
            addNotification({ message: `Serviço "${updatedService.title}" atualizado.`, type: NotificationColorType.Success });
            setIsDataLoading(false);
            resolve();
        }, 500);
      });
  }, [addNotification]);

  const deleteCatalogService = useCallback(async (serviceId: string) => {
    await new Promise<void>(resolve => {
        setTimeout(() => {
            const serviceToDelete = catalogServices.find(s => s.id === serviceId);
            if (serviceToDelete) {
                setCatalogServices(prev => prev.filter(s => s.id !== serviceId));
                addNotification({ message: `Serviço "${serviceToDelete.title}" removido do catálogo.`, type: NotificationColorType.Warning });
            }
            resolve();
        }, 500);
    });
  }, [catalogServices, addNotification]);

  const generateShareableLink = useCallback(async (orderId: string): Promise<string> => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return '';

    const token = 'dz-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    const updatedOrder = { ...order, shareableToken: token };
    
    // Use the existing updateOrder logic, but just update the local state is fine for mock
    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    
    // Since updateOrder is async, we can await it if persistence is needed
    // await updateOrder(updatedOrder);

    return `${window.location.origin}/portal/${token}`;
  }, [orders]);

  const addProofComment = useCallback(async (orderId: string, imageId: string, commentData: Omit<ProofComment, 'id'|'timestamp'|'resolved'>) => {
    await new Promise<void>(resolve => {
        setTimeout(() => {
            setOrders(prevOrders => prevOrders.map(o => {
                if (o.id === orderId) {
                    const newProofingGallery = (o.proofingGallery || []).map(img => {
                        if (img.id === imageId) {
                            const newComment: ProofComment = {
                                id: `pc-${Date.now()}`,
                                timestamp: new Date().toISOString(),
                                resolved: false,
                                ...commentData,
                            };
                            return { ...img, comments: [...img.comments, newComment] };
                        }
                        return img;
                    });
                    return { ...o, proofingGallery: newProofingGallery };
                }
                return o;
            }));
            resolve();
        }, 300);
    });
  }, []);

  const generateInvoice = useCallback(async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !currentUser) return;

    await new Promise<void>(resolve => {
      setTimeout(() => {
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(issueDate.getDate() + 30); // Due in 30 days

        const newInvoice: Invoice = {
          invoiceNumber: `FAT-${String(orders.filter(o => o.invoice).length + 1).padStart(3, '0')}`,
          issueDate: issueDate.toISOString(),
          dueDate: dueDate.toISOString(),
          status: InvoiceStatus.Pendente,
        };

        const updatedOrder = { ...order, invoice: newInvoice };
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        
        addActivityLogEntry(ActivityActionType.InvoiceGenerate, order);
        addNotification({ message: `Fatura ${newInvoice.invoiceNumber} gerada para a OS ${order.orderNumber}.`, type: NotificationColorType.Success, orderId });
        resolve();
      }, 500);
    });
  }, [orders, currentUser, addActivityLogEntry, addNotification]);

  const updateInvoiceStatus = useCallback(async (orderId: string, status: InvoiceStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.invoice || !currentUser) return;

    await new Promise<void>(resolve => {
      setTimeout(() => {
        const updatedOrder = {
          ...order,
          invoice: { ...order.invoice!, status },
        };
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        
        addActivityLogEntry(ActivityActionType.InvoiceStatusUpdate, order, `para ${status}`);
        addNotification({ message: `Status da fatura atualizado para ${status}.`, type: NotificationColorType.Success, orderId });
        resolve();
      }, 300);
    });
  }, [orders, currentUser, addActivityLogEntry, addNotification]);
  
  // --- Financial CRUD ---
  const addFixedCost = useCallback(async (cost: Omit<FixedCost, 'id'>) => {
    const newCost = { ...cost, id: `fc-${Date.now()}`};
    setFixedCosts(prev => [...prev, newCost]);
  }, []);
  const updateFixedCost = useCallback(async (cost: FixedCost) => {
    setFixedCosts(prev => prev.map(c => c.id === cost.id ? cost : c));
  }, []);
  const deleteFixedCost = useCallback(async (costId: string) => {
    setFixedCosts(prev => prev.filter(c => c.id !== costId));
  }, []);
  
  const addVariableCost = useCallback(async (cost: Omit<VariableCost, 'id'>) => {
    const newCost = { ...cost, id: `vc-${Date.now()}`};
    setVariableCosts(prev => [...prev, newCost]);
  }, []);
  const updateVariableCost = useCallback(async (cost: VariableCost) => {
    setVariableCosts(prev => prev.map(c => c.id === cost.id ? cost : c));
  }, []);
  const deleteVariableCost = useCallback(async (costId: string) => {
    setVariableCosts(prev => prev.filter(c => c.id !== costId));
  }, []);

  const addRevenueEntry = useCallback(async (entry: Omit<RevenueEntry, 'id'>) => {
    const newEntry = { ...entry, id: `rev-${Date.now()}`};
    setRevenueEntries(prev => [...prev, newEntry]);
  }, []);
  const updateRevenueEntry = useCallback(async (entry: RevenueEntry) => {
    setRevenueEntries(prev => prev.map(r => r.id === entry.id ? entry : r));
  }, []);
  const deleteRevenueEntry = useCallback(async (entryId: string) => {
    setRevenueEntries(prev => prev.filter(r => r.id !== entryId));
  }, []);

  const sendBotMessage = useCallback((channelId: string, text: string) => {
    const botUser = users.find(u => u.id === 'user-bot');
    if (!botUser) return;

    const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        channelId,
        senderId: botUser.id,
        senderName: botUser.name,
        senderPicture: botUser.picture,
        text,
        timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, botMessage];
        localStorage.setItem('dz-chat-messages', JSON.stringify(updatedMessages));
        return updatedMessages;
    });
    
    setChannels(prevChannels => {
        const updatedChannels = prevChannels.map(c => 
            c.id === channelId ? { ...c, lastMessage: botMessage, unreadCount: (c.unreadCount || 0) + 1 } : c
        );
        localStorage.setItem('dz-chat-channels', JSON.stringify(updatedChannels));
        return updatedChannels;
    });
    
    addNotification({ message: `Nova mensagem de DZ Bot`, type: NotificationColorType.Success });
  }, [users, addNotification]);

  const handleBotCommand = useCallback((channelId: string, commandText: string) => {
    const [command, ...args] = commandText.trim().substring(1).split(/\s+/);
    let responseText = `Comando **/${command}** não reconhecido. Digite **/help** para ver a lista de comandos.`;

    switch (command.toLowerCase()) {
        case 'help':
            responseText = `Comandos disponíveis:\n` +
                         `- **/status [Nº da OS]** - Verifica o status de uma OS. Ex: /status OS-004\n` +
                         `- **/search [termo]** - Busca OSs por cliente ou número. Ex: /search Nike\n` +
                         `- **/help** - Mostra esta ajuda.`;
            break;
        
        case 'status':
            const orderNumber = args[0];
            if (!orderNumber) {
                responseText = 'Por favor, especifique o número da OS. Ex: **/status OS-004**';
            } else {
                const order = orders.find(o => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
                if (order) {
                    const column = kanbanColumns.find(c => c.status === order.status);
                    responseText = `**Status da OS ${order.orderNumber} (${order.client}):**\n` +
                                 `- **Status Atual:** ${column?.title || order.status}\n` +
                                 `- **Responsável:** ${order.responsible || 'N/A'}\n` +
                                 `- **Previsão de Entrega:** ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'N/A'}`;
                } else {
                    responseText = `OS "**${orderNumber}**" não encontrada.`;
                }
            }
            break;

        case 'search':
            const searchTerm = args.join(' ');
            if (!searchTerm) {
                responseText = 'Por favor, especifique um termo para buscar. Ex: **/search Nike**';
            } else {
                const results = orders.filter(o => 
                    o.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
                );
                if (results.length > 0) {
                    responseText = `Encontrei **${results.length}** OS(s) para "**${searchTerm}**":\n` +
                                   results.slice(0, 5).map(o => `- **${o.orderNumber}** (${o.client}): ${kanbanColumns.find(c=>c.status === o.status)?.title || o.status}`).join('\n');
                    if (results.length > 5) responseText += `\n...e mais ${results.length - 5}.`;
                } else {
                    responseText = `Nenhuma OS encontrada para "**${searchTerm}**".`;
                }
            }
            break;
    }
    
    setTimeout(() => sendBotMessage(channelId, responseText), 1000);

  }, [orders, kanbanColumns, sendBotMessage]);


  // --- Chat Functions ---
  const sendMessage = useCallback(async (channelId: string, text: string, attachmentFile?: File, replyTo?: string) => {
    if (!currentUser) return;

    let attachment: ChatAttachment | undefined = undefined;
    if (attachmentFile) {
        // Create a data URL for the mock implementation
        const url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(attachmentFile);
        });
        attachment = {
            name: attachmentFile.name,
            type: attachmentFile.type,
            size: attachmentFile.size,
            url: url,
        };
    }

    const mentionRegex = /@([\w\s()]+)/g;
    const mentions = [...text.matchAll(mentionRegex)];
    const mentionedUserIds: string[] = [];

    if (mentions.length > 0) {
      mentions.forEach(match => {
        const userName = match[1].trim();
        const mentionedUser = users.find(u => u.name === userName);
        if (mentionedUser) {
          mentionedUserIds.push(mentionedUser.id);
        }
      });
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPicture: currentUser.picture,
      text,
      timestamp: new Date().toISOString(),
      attachment,
      ...(replyTo && { replyTo }),
      mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('dz-chat-messages', JSON.stringify(updatedMessages));

    const updatedChannels = channels.map(c => c.id === channelId ? { ...c, lastMessage: newMessage } : c);
    setChannels(updatedChannels);
    localStorage.setItem('dz-chat-channels', JSON.stringify(updatedChannels));

    const channel = channels.find(c => c.id === channelId);
    if (channel) {
        channel.members.forEach(memberId => {
            if (memberId !== currentUser.id && memberId !== 'user-bot') {
                 addNotification({ message: `Nova mensagem de ${currentUser.name}`, details: text || 'Enviou um anexo', type: NotificationColorType.Success });
            }
        });

        mentionedUserIds.forEach(userId => {
            if (userId !== currentUser.id) {
                const channelName = channel.type === ChannelType.Private ? currentUser.name : channel.name;
                addNotification({
                    message: `${currentUser.name} mencionou você`,
                    details: `em #${channelName}: "${text.substring(0, 50)}..."`,
                    type: NotificationColorType.Warning,
                });
            }
        });
        
        if (channel.members.includes('user-bot')) {
            if (text.trim().startsWith('/')) {
                handleBotCommand(channelId, text.trim());
            } else {
                setTimeout(() => {
                    sendBotMessage(channelId, `Olá! Eu sou um bot. Para interagir comigo, use comandos como **/status OS-001** ou digite **/help** para ver todas as opções.`);
                }, 1500);
            }
        }
    }
  }, [currentUser, channels, messages, addNotification, users, handleBotCommand, sendBotMessage]);
  
  const createChannel = useCallback(async (name: string, members: string[], type: ChannelType): Promise<string | null> => {
    if (type === ChannelType.Private) {
        const existing = channels.find(c => 
            c.type === ChannelType.Private &&
            c.members.length === 2 &&
            c.members.every(m => members.includes(m))
        );
        if (existing) {
            addNotification({ message: 'Conversa já existe.', type: NotificationColorType.Warning });
            return existing.id;
        }
    }
    
    const newChannel: ChatChannel = {
        id: `channel-${Date.now()}`,
        name, type, members, unreadCount: 0,
    };
    
    const updatedChannels = [newChannel, ...channels];
    setChannels(updatedChannels);
    localStorage.setItem('dz-chat-channels', JSON.stringify(updatedChannels));

    const otherUser = users.find(u => u.id === members.find(m => m !== currentUser?.id));
    const channelName = type === ChannelType.Group ? name : `com ${otherUser?.name || 'usuário'}`;
    addNotification({ message: `Novo chat "${channelName}" criado.`, type: NotificationColorType.Success });
    return newChannel.id;
  }, [channels, addNotification, users, currentUser]);

  const toggleReaction = useCallback(async (channelId: string, messageId: string, emoji: string) => {
    if (!currentUser) return;

    await new Promise<void>(resolve => {
        setTimeout(() => {
            const updatedMessages = messages.map(msg => {
                if (msg.id === messageId) {
                    const newReactions = { ...(msg.reactions || {}) };
                    const usersForEmoji = newReactions[emoji] || [];
                    
                    if (usersForEmoji.includes(currentUser.id)) {
                        // User is removing their reaction
                        newReactions[emoji] = usersForEmoji.filter(userId => userId !== currentUser.id);
                        if (newReactions[emoji].length === 0) {
                            delete newReactions[emoji];
                        }
                    } else {
                        // User is adding a reaction
                        newReactions[emoji] = [...usersForEmoji, currentUser.id];
                    }
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            });
            setMessages(updatedMessages);
            localStorage.setItem('dz-chat-messages', JSON.stringify(updatedMessages));
            resolve();
        }, 100); // simulate quick network latency
    });
  }, [currentUser, messages]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    await new Promise<void>(resolve => {
        setTimeout(() => {
            const updatedMessages = messages.map(msg => 
                msg.id === messageId 
                ? { ...msg, text: newText, editedAt: new Date().toISOString() } 
                : msg
            );
            setMessages(updatedMessages);
            localStorage.setItem('dz-chat-messages', JSON.stringify(updatedMessages));
            resolve();
        }, 100);
    });
  }, [messages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    await new Promise<void>(resolve => {
        setTimeout(() => {
            let channelIdOfDeletedMessage: string | null = null;
            const updatedMessages = messages.filter(msg => {
                if (msg.id === messageId) {
                    channelIdOfDeletedMessage = msg.channelId;
                    return false;
                }
                return true;
            });

            setMessages(updatedMessages);
            localStorage.setItem('dz-chat-messages', JSON.stringify(updatedMessages));

            if (channelIdOfDeletedMessage) {
                const channelMessages = updatedMessages
                    .filter(m => m.channelId === channelIdOfDeletedMessage)
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                
                const newLastMessage = channelMessages[channelMessages.length - 1];

                const updatedChannels = channels.map(c => 
                    c.id === channelIdOfDeletedMessage ? { ...c, lastMessage: newLastMessage } : c
                );
                setChannels(updatedChannels);
                localStorage.setItem('dz-chat-channels', JSON.stringify(updatedChannels));
            }
            resolve();
        }, 100);
    });
  }, [messages, channels]);

  const setUserTyping = useCallback((channelId: string) => {
      if (!currentUser) return;
      const now = Date.now();
      const userName = currentUser.name;

      setTypingStatus(prev => {
          const channelTypers = prev[channelId] || [];
          const userIndex = channelTypers.findIndex(t => t.userName === userName);
          let newChannelTypers;

          if (userIndex > -1) {
              newChannelTypers = [...channelTypers];
              newChannelTypers[userIndex] = { userName, timestamp: now };
          } else {
              newChannelTypers = [...channelTypers, { userName, timestamp: now }];
          }
          return { ...prev, [channelId]: newChannelTypers };
      });
  }, [currentUser]);

  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          const timeout = 3000; // 3 seconds
          setTypingStatus(prev => {
              const newStatus: Record<string, TypingIndicator[]> = {};
              let hasChanged = false;
              for (const channelId in prev) {
                  const freshTypers = prev[channelId].filter(t => now - t.timestamp < timeout);
                  if (freshTypers.length > 0) {
                      newStatus[channelId] = freshTypers;
                  }
                  if (freshTypers.length !== prev[channelId].length) {
                      hasChanged = true;
                  }
              }
              return hasChanged ? newStatus : prev;
          });
      }, 1500);
      return () => clearInterval(interval);
  }, []);


  const value: AppContextType = {
    orders, quotes, users, catalogServices, currentUser, activityLog, notifications, currentPage,
    recentlyUpdatedOrderId, isSummaryLoading, filteredOrders,
    deliveredOrders, isInitializing, isDataLoading, authError,
    fixedCosts, variableCosts, revenueEntries,
    channels, messages, typingStatus,
    kanbanColumns, setKanbanColumns, customFieldDefinitions, setCustomFieldDefinitions,
    kanbanFilters, kanbanViews,
    login, logout, setCurrentPage, addOrder, updateOrder, deleteOrder,
    handleStatusChange, addNotification, removeNotification,
    updateKanbanFilters, saveKanbanView, applyKanbanView, deleteKanbanView, clearFilters, setIsStalledFilterActive,
    addUser, updateUser, deleteUser,
    addTask, updateTask, deleteTask, addComment,
    addQuote, updateQuote, deleteQuote,
    addCatalogService, updateCatalogService, deleteCatalogService,
    generateShareableLink,
    addProofComment,
    generateInvoice,
    updateInvoiceStatus,
    addFixedCost, updateFixedCost, deleteFixedCost,
    addVariableCost, updateVariableCost, deleteVariableCost,
    addRevenueEntry, updateRevenueEntry, deleteRevenueEntry,
    sendMessage, createChannel, toggleReaction, editMessage, deleteMessage, setUserTyping,
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