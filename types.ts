

export enum UserRole {
  Admin = 'Admin',
  Assistant = 'Assistant',
  Viewer = 'Viewer',
}

export interface User {
  id: string; // Firebase Auth User ID
  name: string;
  email: string;
  picture?: string;
  role: UserRole;
  password?: string; // Used for creating/updating users in demo mode
}

export enum OrderStatus {
  Waiting = 'Aguardando produto',
  Shooting = 'Em foto',
  Development = 'Revelação',
  PostProduction = 'Pós',
  ColorGrading = 'Cromia',
  Approval = 'Aprovação',
  Delivered = 'Entregue',
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPicture?: string;
  text: string;
  timestamp: string;
}

export interface StoredFile {
  name: string;
  url: string;
  type: string;
  size: number;
  path: string; // Full path in Firebase Storage for deletion
}

export interface ServiceOrder {
  id: string;
  client: string;
  orderNumber: string;
  description: string;
  status: OrderStatus;
  progress: number;
  thumbnailUrl: string;
  link?: string;
  responsible?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  lastStatusUpdate: string;
  creationDate: string;
  imageCount?: number;
  value?: number;
  tasks?: Task[];
  comments?: Comment[];
  files?: StoredFile[];
}

export interface ServiceOrderTemplate {
  id: string;
  title: string;
  description: string;
  defaultDescription: string;
  defaultImageCount: number;
  defaultValue: number;
}


export interface KanbanColumn {
  title: string;
  status: OrderStatus;
}

export enum NotificationColorType {
  Success = 'success',
  Warning = 'warning',
  Alert = 'alert',
}

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationColorType;
  orderId?: string;
  details?: string;
}

export enum ActivityActionType {
  Create = 'criou a OS',
  Update = 'editou a OS',
  Delete = 'excluiu a OS',
  Move = 'moveu a OS',
  Complete = 'concluiu a OS',
  Comment = 'comentou na OS',
  TaskAdd = 'adicionou uma tarefa na OS',
  TaskComplete = 'completou uma tarefa na OS',
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: ActivityActionType;
  orderId: string;
  orderNumber: string;
  clientName: string;
  details?: string; // e.g., "de 'Em Foto' para 'Revelação'"
}

export interface WeeklyReportData {
  id: string;
  period: { start: string; end: string };
  generatedAt: string;
  createdCount: number;
  deliveredCount: number;
  onTimePercentage: string;
  avgDeliveryDays: string;
  topClients: { name: string; count: number }[];
  deliveriesByDay: number[];
  statusDistribution: { labels: string[], data: number[] };
  teamPerformance: { userName:string; deliveries: number; updates: number }[];
}

// FIX: Moved this interface from DailySummaryModal.tsx to break a circular dependency.
export interface DailySummaryData {
  userName: string;
  inProgress: number;
  delivered: number;
  waiting: number;
  newOrders: number;
  stalled: ServiceOrder[];
  dueToday: number;
}
