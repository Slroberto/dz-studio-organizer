// types.ts (Versão Final e Ajustada)

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

// --- INTERFACE AJUSTADA ---
// Esta é a versão refinada da sua interface original.
// Garante que todos os campos da planilha sejam mapeados corretamente.
export interface ServiceOrder {
  id: string;                 // Identificador único para o React (usaremos o Número da OS)
  orderNumber: string;        // Corresponde a "Número da OS"
  client: string;             // Corresponde a "Cliente"
  description: string;        // Corresponde a "Descrição"
  status: OrderStatus;        // Corresponde a "Status", usando seu enum
  lastStatusUpdate: string;   // Corresponde a "Última Atualização de Status"
  creationDate: string;       // Corresponde a "Data de Criação"
  progress?: number;          // Corresponde a "Progresso"
  thumbnailUrl?: string;      // Corresponde a "URL da Miniatura"
  link?: string;              // Corresponde a "Link do Drive"
  responsible?: string;       // Corresponde a "Responsável"
  deliveryDate?: string;      // Corresponde a "Data de Entrega"
  expectedDeliveryDate?: string; // Corresponde a "Previsão de Entrega"
  imageCount?: number;        // Corresponde a "Qtd imagens"
  _rowIndex?: number;         // Interno: para rastrear a linha na planilha
}
// --- FIM DA INTERFACE AJUSTADA ---

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

export interface DailySummaryData {
  userName: string;
  inProgress: number;
  delivered: number;
  waiting: number;
  newOrders: number;
  stalled: ServiceOrder[];
  dueToday: number;
}
