export enum UserRole {
  Admin = 'Admin',
  Assistant = 'Assistant',
  Viewer = 'Viewer',
}

export interface User {
  id: string; // Google User ID
  name: string;
  email: string;
  picture?: string; // Google Profile Picture URL
  role: UserRole;
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
  _rowIndex?: number; // Internal: to track row number in Google Sheets
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