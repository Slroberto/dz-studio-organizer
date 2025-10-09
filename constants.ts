// CÓDIGO FINAL E DEFINITIVO para constants.ts

import { OrderStatus, KanbanColumn, UserRole } from './types';

// A lista de usuários permitidos.
export const USER_ROLES: { [email: string]: UserRole } = {
  // Você, como administrador:
  'sandrosam@gmail.com': UserRole.Admin, 
  
  // (Opcional) Remova as outras contas de trabalho até a publicação:
  // 'sandro@dz.studio': UserRole.Admin,
  // 'sandro@dzstudio.com.br': UserRole.Admin,
  // 'assistente@dz.studio': UserRole.Assistant,
};


export const KANBAN_COLUMNS: KanbanColumn[] = [
// ... (restante do código das colunas Kanban)
];
