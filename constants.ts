import { KanbanColumn, ServiceOrderTemplate, CustomFieldDefinition, FinancialCategory } from './types';

// User roles are now determined by email address from Google Sign-In.
// This acts as an access control list.
// export const USER_ROLES: { [email: string]: UserRole } = {
//   'sandro@dz.studio': UserRole.Admin,
//   'sandro@dzstudio.com.br': UserRole.Admin, // Added variant
//   'assistente@dz.studio': UserRole.Assistant,
// };

export const SERVICE_ORDER_TEMPLATES: ServiceOrderTemplate[] = [
  {
    id: 'template-1',
    title: 'E-commerce Padrão',
    description: 'Pacote básico para fotos de produtos em fundo branco.',
    defaultDescription: 'Fotos de produto em fundo branco para e-commerce. Inclui tratamento básico.',
    defaultImageCount: 20,
    defaultValue: 500,
  },
  {
    id: 'template-2',
    title: 'Campanha de Moda',
    description: 'Produção completa para campanhas, incluindo modelo e locação.',
    defaultDescription: 'Sessão de fotos para campanha de moda. Inclui modelo, maquiagem e tratamento avançado.',
    defaultImageCount: 15,
    defaultValue: 2500,
  },
  {
    id: 'template-3',
    title: 'Still Life Ambientado',
    description: 'Fotos de produtos com composição de cena e iluminação especial.',
    defaultDescription: 'Fotos de produto com composição de cena (still life). Inclui direção de arte e tratamento detalhado.',
    defaultImageCount: 10,
    defaultValue: 1200,
  },
  {
    id: 'template-4',
    title: 'Fotografia Gastronômica',
    description: 'Fotos para cardápios, apps de delivery e redes sociais.',
    defaultDescription: 'Fotos de pratos para restaurante. Inclui food styling e tratamento de cores vibrantes.',
    defaultImageCount: 30,
    defaultValue: 1800,
  }
];

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { title: 'Aguardando produto', status: 'Aguardando produto', color: '#3b82f6' }, // Blue
  { title: 'Cancelado', status: 'Cancelado', color: '#6b7280' }, // Gray
  { title: 'Conferência de Produto', status: 'Conferência de Produto', color: '#ef4444' }, // Red
  { title: 'Em foto', status: 'Em foto', color: '#f97316' }, // Orange
  { title: 'Revelação', status: 'Revelação', color: '#eab308' }, // Yellow
  { title: 'Pós-produção', status: 'Pós-produção', color: '#a855f7' }, // Purple
  { title: 'Cromia', status: 'Cromia', color: '#ec4899' }, // Pink
  { title: 'Aprovação', status: 'Aprovação', color: '#f43f5e' }, // Rose
  { title: 'Entrega', status: 'Entrega', color: '#16a34a' }, // Green-600
  { title: 'Entregue', status: 'Entregue', color: '#22c55e' }, // Green-500 (Final Status)
];

export const DEFAULT_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-1',
    name: 'Local da Sessão',
    type: 'text'
  },
  {
    id: 'cf-2',
    name: 'Figurino Recebido?',
    type: 'boolean'
  },
  {
    id: 'cf-3',
    name: 'Prazo',
    type: 'date'
  }
];

export const FINANCIAL_CATEGORIES: FinancialCategory[] = [
  'Salário', 'Aluguel', 'Software', 'Marketing', 'Matéria-Prima', 'Freelancer', 'Impostos', 'Outros'
];