import { OrderStatus, KanbanColumn, UserRole } from './types';

// User roles are now determined by email address from Google Sign-In.
// This acts as an access control list.
export const USER_ROLES: { [email: string]: UserRole } = {
  'sandro@dz.studio': UserRole.Admin,
  'sandro@dzstudio.com.br': UserRole.Admin, // Added variant
  'assistente@dz.studio': UserRole.Assistant,
};


export const KANBAN_COLUMNS: KanbanColumn[] = [
  { title: 'Aguardando produto', status: OrderStatus.Waiting },
  { title: 'Em foto', status: OrderStatus.Shooting },
  { title: 'Revelação', status: OrderStatus.Development },
  { title: 'Pós-produção', status: OrderStatus.PostProduction },
  { title: 'Cromia', status: OrderStatus.ColorGrading },
  { title: 'Aprovação', status: OrderStatus.Approval },
  { title: 'Entregue', status: OrderStatus.Delivered },
];
