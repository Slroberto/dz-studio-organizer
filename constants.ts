import { OrderStatus, KanbanColumn, ServiceOrderTemplate } from './types';

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


export const KANBAN_COLUMNS: KanbanColumn[] = [
  { title: 'Aguardando produto', status: OrderStatus.Waiting },
  { title: 'Em foto', status: OrderStatus.Shooting },
  { title: 'Revelação', status: OrderStatus.Development },
  { title: 'Pós-produção', status: OrderStatus.PostProduction },
  { title: 'Cromia', status: OrderStatus.ColorGrading },
  { title: 'Aprovação', status: OrderStatus.Approval },
  { title: 'Entregue', status: OrderStatus.Delivered },
];