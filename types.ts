export enum UserRole {
  Admin = 'Admin',
  Assistant = 'Assistant',
  Viewer = 'Viewer',
}

export interface User {
  id: string; // Google User ID or unique identifier in mock mode
  name: string;
  email: string;
  picture?: string; // Google Profile Picture URL
  role: UserRole;
  password?: string; // Added for mock user management
}

export type OrderStatus = string;

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id:string;
  userId: string;
  userName: string;
  userPicture?: string;
  text: string;
  timestamp: string;
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'boolean';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
}

// --- Visual Proofing Types ---
export interface ProofComment {
  id: string;
  x: number; // percentage
  y: number; // percentage
  text: string;
  author: string;
  timestamp: string;
  resolved: boolean;
}

export interface ProofImage {
  id: string;
  url: string;
  comments: ProofComment[];
}

// --- Invoicing Types ---
export enum InvoiceStatus {
  Pendente = 'Pendente',
  Pago = 'Pago',
  Atrasado = 'Atrasado',
}

export interface Invoice {
  invoiceNumber: string;
  issueDate: string; // ISO String
  dueDate: string; // ISO String
  status: InvoiceStatus;
}

export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

// --- File Management Types ---
export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  progress?: number; // 0 to 100
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
  costs?: number; // Added for financial tracking
  profitMargin?: number; // Calculated field, might not be stored directly
  invoice?: Invoice; // Added for invoicing feature
  tasks?: Task[];
  comments?: Comment[];
  shareableToken?: string;
  customFields?: Record<string, string | number | boolean>;
  proofingGallery?: ProofImage[];
  notes?: string;
  files?: FileAttachment[];
  priority?: Priority;
  assignedFreelancers?: string[]; // Array of Freelancer IDs
  _rowIndex?: number;
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
  color: string;
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
  InvoiceGenerate = 'gerou a fatura para a OS',
  InvoiceStatusUpdate = 'atualizou o status da fatura da OS'
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

// --- Commercial Dashboard & Quote Types ---

export enum QuoteStatus {
  Draft = 'Rascunho',
  Sent = 'Enviado',
  Negotiating = 'Em Negociação',
  Approved = 'Aprovado',
  Rejected = 'Recusado',
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CommercialQuote {
  id: string;
  quoteNumber: string;
  client: string;
  responsible: string;
  status: QuoteStatus;
  sentDate: string; // ISO String
  validUntil: string; // ISO String
  items: QuoteItem[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  terms: string;
  notes?: string; // Internal notes, not visible on PDF
  value: number; // This will be the calculated total
  decisionDate?: string; // ISO String
  lossReason?: 'Preço' | 'Prazo' | 'Concorrência' | 'Escopo' | 'Outro';
}

// --- Opportunities Types ---
export enum OpportunityStatus {
  Prospecting = 'Prospecção',
  ForAnalysis = 'Para Análise',
  Contacted = 'Contatado',
  Negotiating = 'Negociando',
  Won = 'Ganho',
  Lost = 'Perdido',
}

export interface Opportunity {
  id: string;
  title: string;
  clientOrSource: string;
  budget?: number;
  deadline?: string; // ISO String
  link?: string;
  description?: string;
  status: OpportunityStatus;
  lossReason?: 'Preço' | 'Prazo' | 'Concorrência' | 'Escopo' | 'Outro';
  lossNotes?: string;
  imageUrl?: string;
  aiAnalysis?: string;
  clientProfileAnalysis?: string;
}


// --- Catalog Service Item Type ---
export interface CatalogServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
}

// --- Kanban Filters & Views ---
export interface KanbanFilters {
  searchTerm?: string;
  client?: string;
  responsible?: string;
  startDate?: string;
  endDate?: string;
  priority?: Priority;
  customFields?: Record<string, any>;
}

export interface KanbanView {
  id: string;
  name: string;
  filters: KanbanFilters;
}

// --- Financial Dashboard Types ---
export type FinancialCategory = 'Salário' | 'Aluguel' | 'Software' | 'Marketing' | 'Matéria-Prima' | 'Freelancer' | 'Impostos' | 'Outros';

export interface FixedCost {
  id: string;
  name: string;
  value: number;
  category: FinancialCategory;
  dueDate?: number; // Day of the month
}

export interface VariableCost {
  id: string;
  description: string;
  value: number;
  category: FinancialCategory;
  date: string; // ISO String
  orderId?: string; // Optional: link to a specific OS
}

export interface RevenueEntry {
  id:string;
  description: string;
  value: number;
  date: string; // ISO String
  orderId?: string; // Optional: link to a specific OS
}

// --- Chat Types ---
export enum ChannelType {
  Group = 'group',
  Private = 'private',
}

export interface ChatAttachment {
  name: string;
  type: string; // MIME type
  url: string;  // data: URL for mock
  size: number; // in bytes
}

// --- AI Assistant Types ---
export interface ActionableIntent {
  intent: 'CHANGE_STATUS' | 'CREATE_TASK';
  parameters: {
    orderNumber?: string;
    newStatus?: string;
    tasks?: string[];
  };
  message: string; // The confirmation message for the user
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string; // userId
  senderName: string;
  senderPicture?: string;
  text: string;
  timestamp: string; // ISO String
  attachment?: ChatAttachment;
  reactions?: { [emoji: string]: string[] }; // emoji: [userId, userId, ...]
  replyTo?: string; // messageId of the message being replied to
  mentions?: string[]; // Array of user IDs
  status?: 'thinking';
  editedAt?: string; // ISO String for when the message was last edited
  suggestion?: ActionableIntent;
}

export interface ChatChannel {
  id: string;
  name: string; // For groups, this is the group name. For private, it could be the other user's name.
  type: ChannelType;
  members: string[]; // array of user IDs
  lastMessage?: ChatMessage;
  unreadCount: number; // This will be calculated on the client
}

// --- Integrations Types ---
export interface SearchSource {
  id: string;
  name: 'Workana' | '99Freelas';
  apiKey: string;
  keywords: string; // Comma-separated
  enabled: boolean;
}

// --- Freelancer Management Types ---
export type FreelancerSpecialty = 'Retoque' | 'Edição de Vídeo' | 'Food Styling' | 'Produção' | 'Outro';
export type RateType = 'hora' | 'dia' | 'projeto';
export type AvailabilityStatus = 'Disponível' | 'Ocupado' | 'Férias';

export interface Freelancer {
  id: string;
  name: string;
  email: string;
  picture?: string;
  specialty: FreelancerSpecialty | string;
  rateType: RateType;
  rateValue: number;
  availability: AvailabilityStatus;
  portfolioLink?: string;
  notes?: string;
}