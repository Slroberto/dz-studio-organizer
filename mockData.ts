import { ServiceOrder, User, ActivityLogEntry, OrderStatus, UserRole, ActivityActionType, CommercialQuote, QuoteStatus, QuoteItem, CatalogServiceItem, InvoiceStatus, FixedCost, VariableCost, RevenueEntry, ChatChannel, ChannelType, ChatMessage } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1', name: 'Sandro (Admin)', email: 'sandro@dz.studio', picture: 'https://i.pravatar.cc/150?u=sandro', role: UserRole.Admin, password: '123'
  },
  {
    id: 'user-2', name: 'Ana (Assistente)', email: 'ana@dz.studio', picture: 'https://i.pravatar.cc/150?u=ana', role: UserRole.Assistant, password: '123'
  },
  {
    id: 'user-3', name: 'Beto (Viewer)', email: 'beto@viewer.com', picture: 'https://i.pravatar.cc/150?u=beto', role: UserRole.Viewer, password: '123'
  },
  {
    id: 'user-bot', name: 'DZ Bot', email: 'bot@dz.studio', picture: 'https://i.pravatar.cc/150?u=bot', role: UserRole.Assistant, password: '123'
  },
];

export const MOCK_USER: User = MOCK_USERS[0];

export const MOCK_ORDERS: ServiceOrder[] = [
  {
    id: 'OS-001', client: 'Nike', orderNumber: 'OS-001', description: 'Fotos de calçados para campanha de verão.', status: 'Aguardando produto',
    progress: 0, thumbnailUrl: 'https://picsum.photos/seed/nike/400/300', responsible: 'Ana (Assistente)',
    expectedDeliveryDate: '2024-08-10T12:00:00.000Z', lastStatusUpdate: '2024-07-28T10:00:00.000Z', creationDate: '2024-07-28T10:00:00.000Z', imageCount: 50, value: 3500, costs: 1200, _rowIndex: 2, link: 'https://www.google.com', tasks: [], comments: [],
    customFields: {
      'cf-location': 'Estúdio A',
      'cf-deadline-internal': '2024-08-08T12:00:00.000Z',
    },
    notes: 'Aguardando chegada dos tênis brancos. Previsão do cliente: 05/08.',
    shareableToken: 'dz-abc123xyz'
  },
  {
    id: 'OS-002', client: 'Adidas', orderNumber: 'OS-002', description: 'Still de roupas esportivas coleção outono.', status: 'Em foto',
    progress: 16, thumbnailUrl: 'https://picsum.photos/seed/adidas/400/300', responsible: 'Beto (Viewer)',
    expectedDeliveryDate: '2024-08-12T12:00:00.000Z', lastStatusUpdate: '2024-07-29T14:00:00.000Z', creationDate: '2024-07-27T11:00:00.000Z', imageCount: 30, value: 2800, costs: 1800, _rowIndex: 3, link: '#', tasks: [], comments: [],
    notes: 'Fotógrafo Beto alocado. Usar fundo cinza claro.'
  },
  {
    id: 'OS-003', client: 'Puma', orderNumber: 'OS-003', description: 'Fotos de acessórios para e-commerce.', status: 'Revelação',
    progress: 33, thumbnailUrl: 'https://picsum.photos/seed/puma/400/300', responsible: 'Carlos',
    expectedDeliveryDate: '2024-08-05T12:00:00.000Z', lastStatusUpdate: '2024-07-30T09:20:00.000Z', creationDate: '2024-07-26T15:00:00.000Z', imageCount: 120, value: 1500, costs: 450, _rowIndex: 4, link: '#', tasks: [], comments: []
  },
  {
    id: 'OS-004', client: 'Coca-Cola', orderNumber: 'OS-004', description: 'Fotos de produto para campanha de marketing.', status: 'Pós-produção',
    progress: 50, thumbnailUrl: 'https://picsum.photos/seed/cocacola/400/300', responsible: 'Ana (Assistente)',
    expectedDeliveryDate: '2024-08-15T12:00:00.000Z', lastStatusUpdate: '2024-07-30T11:30:00.000Z', creationDate: '2024-07-25T09:00:00.000Z', imageCount: 15, value: 5000, costs: 2200, _rowIndex: 5, link: '#',
    tasks: [
        { id: 't-4-1', text: 'Recorte das garrafas', completed: true },
        { id: 't-4-2', text: 'Ajuste de cor e contraste', completed: true },
        { id: 't-4-3', text: 'Remoção de imperfeições', completed: false },
        { id: 't-4-4', text: 'Adicionar reflexos e sombras', completed: false }
    ],
    comments: [
        { id: 'c-4-1', userId: 'user-1', userName: 'Sandro (Admin)', userPicture: 'https://i.pravatar.cc/150?u=sandro', text: 'Atenção aos reflexos na garrafa, precisam parecer naturais.', timestamp: '2024-07-30T11:35:00.000Z' }
    ],
    customFields: {
        'cf-priority': 10,
        'cf-rush-job': true,
    }
  },
  {
    id: 'OS-005', client: 'Apple', orderNumber: 'OS-005', description: 'Fotos de novos iPhones para lançamento.', status: 'Cromia',
    progress: 67, thumbnailUrl: 'https://picsum.photos/seed/apple/400/300', responsible: 'Sandro (Admin)',
    expectedDeliveryDate: '2024-08-02T12:00:00.000Z', lastStatusUpdate: '2024-07-29T18:00:00.000Z', creationDate: '2024-07-24T10:00:00.000Z', imageCount: 25, value: 8000, costs: 6500, _rowIndex: 6, link: '#', tasks: [], comments: []
  },
  {
    id: 'OS-006', client: 'Samsung', orderNumber: 'OS-006', description: 'Campanha para o novo Galaxy Fold.', status: 'Aprovação',
    progress: 84, thumbnailUrl: 'https://picsum.photos/seed/samsung/400/300', responsible: 'Beto (Viewer)',
    expectedDeliveryDate: '2024-07-31T12:00:00.000Z', lastStatusUpdate: '2024-07-30T16:45:00.000Z', creationDate: '2024-07-22T14:00:00.000Z', imageCount: 40, value: 7500, costs: 3000, _rowIndex: 7, link: '#', tasks: [], comments: [],
    proofingGallery: [
        {
            id: 'img-1',
            url: 'https://picsum.photos/seed/samsung-proof1/1200/800',
            comments: [
                { id: 'pc-1', x: 25.5, y: 40.2, text: 'Aumentar o brilho nesta área.', author: 'Cliente', timestamp: '2024-07-31T10:00:00.000Z', resolved: false },
                { id: 'pc-2', x: 70, y: 65.8, text: 'Remover este risco no produto.', author: 'Cliente', timestamp: '2024-07-31T10:02:00.000Z', resolved: false },
            ]
        },
        {
            id: 'img-2',
            url: 'https://picsum.photos/seed/samsung-proof2/1200/800',
            comments: []
        },
        {
            id: 'img-3',
            url: 'https://picsum.photos/seed/samsung-proof3/1200/800',
            comments: [
                 { id: 'pc-3', x: 50, y: 50, text: 'Cor do fundo OK!', author: 'Cliente', timestamp: '2024-07-31T10:05:00.000Z', resolved: true },
            ]
        }
    ]
  },
  {
    id: 'OS-007', client: 'Gucci', orderNumber: 'OS-007', description: 'Fotos de bolsas e sapatos de luxo.', status: 'Entregue',
    progress: 100, thumbnailUrl: 'https://picsum.photos/seed/gucci/400/300', responsible: 'Sandro (Admin)',
    deliveryDate: '2024-07-29T12:00:00.000Z', expectedDeliveryDate: '2024-07-30T12:00:00.000Z', lastStatusUpdate: '2024-07-29T12:00:00.000Z', creationDate: '2024-07-20T16:00:00.000Z', imageCount: 18, value: 9500, costs: 4000, _rowIndex: 8, link: '#', tasks: [], comments: [],
    invoice: { invoiceNumber: 'FAT-001', issueDate: '2024-07-29T12:00:00.000Z', dueDate: '2024-08-28T12:00:00.000Z', status: InvoiceStatus.Pago }
  },
   {
    id: 'OS-008', client: 'Magazine Luiza', orderNumber: 'OS-008', description: 'Fotos de eletrodomésticos para o site.', status: 'Entregue',
    progress: 100, thumbnailUrl: 'https://picsum.photos/seed/magalu/400/300', responsible: 'Carlos',
    deliveryDate: '2024-08-01T12:00:00.000Z', expectedDeliveryDate: '2024-08-05T12:00:00.000Z',
    lastStatusUpdate: '2024-08-01T17:00:00.000Z', creationDate: '2024-07-30T17:00:00.000Z', imageCount: 75, value: 4000, costs: 1500, _rowIndex: 9, link: '#', tasks: [], comments: [],
    invoice: { invoiceNumber: 'FAT-002', issueDate: '2024-08-01T12:00:00.000Z', dueDate: '2024-08-31T12:00:00.000Z', status: InvoiceStatus.Pendente }
  },
];

export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
    { id: 'log-1', timestamp: '2024-07-30T17:00:00.000Z', userId: 'user-1', userName: 'Sandro (Admin)', action: ActivityActionType.Create, orderId: 'OS-008', orderNumber: 'OS-008', clientName: 'Magazine Luiza' },
    { id: 'log-2', timestamp: '2024-07-30T16:45:00.000Z', userId: 'user-3', userName: 'Beto (Viewer)', action: ActivityActionType.Move, orderId: 'OS-006', orderNumber: 'OS-006', clientName: 'Samsung', details: "de 'Cromia' para 'Aprovação'" },
    { id: 'log-3', timestamp: '2024-07-30T11:30:00.000Z', userId: 'user-2', userName: 'Ana (Assistente)', action: ActivityActionType.Update, orderId: 'OS-004', orderNumber: 'OS-004', clientName: 'Coca-Cola', details: "Descrição atualizada" },
    { id: 'log-4', timestamp: '2024-07-29T12:00:00.000Z', userId: 'user-1', userName: 'Sandro (Admin)', action: ActivityActionType.Complete, orderId: 'OS-007', orderNumber: 'OS-007', clientName: 'Gucci' },
];

const generateItems = (count: number): QuoteItem[] => Array.from({ length: count }, (_, i) => ({
    id: `item-${Date.now()}-${i}`,
    description: `Serviço de Fotografia ${i + 1}`,
    quantity: 1 + Math.floor(Math.random() * 5),
    unitPrice: 500 + Math.floor(Math.random() * 2000),
}));

const calculateTotal = (items: QuoteItem[], discountType: 'percentage' | 'fixed', discountValue: number): number => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    if (discountType === 'percentage') {
        return subtotal * (1 - discountValue / 100);
    }
    return subtotal - discountValue;
};


const quote1Items = generateItems(3);
const quote2Items = generateItems(2);
const quote3Items = generateItems(5);
const quote4Items = generateItems(4);
const quote5Items = generateItems(1);


export const MOCK_QUOTES: CommercialQuote[] = [
    {
      id: 'Q-001', quoteNumber: 'ORC-2024-053', client: 'Nike', responsible: 'Sandro (Admin)', status: QuoteStatus.Approved,
      sentDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
      validUntil: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
      items: quote1Items, discountType: 'fixed', discountValue: 200, value: calculateTotal(quote1Items, 'fixed', 200),
      terms: 'Pagamento em 2x. 50% de entrada e 50% na entrega.',
      decisionDate: new Date().toISOString(),
    },
    {
      id: 'Q-002', quoteNumber: 'ORC-2024-052', client: 'Adidas', responsible: 'Ana (Assistente)', status: QuoteStatus.Rejected,
      sentDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
      validUntil: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
      items: quote2Items, discountType: 'percentage', discountValue: 10, value: calculateTotal(quote2Items, 'percentage', 10),
      terms: 'Pagamento à vista com 5% de desconto adicional.',
      decisionDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), lossReason: 'Preço',
    },
    {
      id: 'Q-003', quoteNumber: 'ORC-2024-054', client: 'Coca-Cola', responsible: 'Sandro (Admin)', status: QuoteStatus.Negotiating,
      sentDate: new Date().toISOString(), validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      items: quote3Items, discountType: 'fixed', discountValue: 0, value: calculateTotal(quote3Items, 'fixed', 0),
      terms: 'Validade da proposta: 30 dias.',
    },
    {
      id: 'Q-004', quoteNumber: 'ORC-2024-055', client: 'Puma', responsible: 'Ana (Assistente)', status: QuoteStatus.Sent,
      sentDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      validUntil: new Date(new Date().setDate(new Date().getDate() + 29)).toISOString(),
      items: quote4Items, discountType: 'percentage', discountValue: 0, value: calculateTotal(quote4Items, 'percentage', 0),
      terms: 'Material será entregue via Google Drive.',
    },
     {
      id: 'Q-005', quoteNumber: 'ORC-2024-056', client: 'Apple', responsible: 'Sandro (Admin)', status: QuoteStatus.Draft,
      sentDate: new Date().toISOString(), validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      items: quote5Items, discountType: 'fixed', discountValue: 0, value: calculateTotal(quote5Items, 'fixed', 0),
      terms: 'A definir.',
    },
];

export const MOCK_CATALOG_SERVICES: CatalogServiceItem[] = [
    {
        id: 'cat-1',
        title: 'Diária de Estúdio',
        description: 'Diária completa de estúdio (8 horas) com equipamentos de iluminação inclusos.',
        price: 1800.00
    },
    {
        id: 'cat-2',
        title: 'Recorte de Fundo (Simples)',
        description: 'Recorte de fundo para produtos com contornos simples e definidos.',
        price: 8.50
    },
    {
        id: 'cat-3',
        title: 'Recorte de Fundo (Complexo)',
        description: 'Recorte de fundo para produtos com contornos complexos (ex: cabelo, pelúcia, plantas).',
        price: 25.00
    },
    {
        id: 'cat-4',
        title: 'Tratamento de Pele Básico',
        description: 'Tratamento de pele com remoção de pequenas imperfeições e uniformização de tom.',
        price: 35.00
    },
     {
        id: 'cat-5',
        title: 'Tratamento de Pele Avançado',
        description: 'Tratamento de pele avançado com técnica de Dodge & Burn e separação de frequência.',
        price: 90.00
    },
    {
        id: 'cat-6',
        title: 'Foto Still Ambientada',
        description: 'Produção e clique de foto still com composição de cena e direção de arte.',
        price: 450.00
    }
];

// --- Mock Financial Data ---
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

export const MOCK_FIXED_COSTS: FixedCost[] = [
  { id: 'fc-1', name: 'Aluguel do Estúdio', value: 3500, category: 'Aluguel', dueDate: 5 },
  { id: 'fc-2', name: 'Salário - Sandro', value: 5000, category: 'Salário', dueDate: 5 },
  { id: 'fc-3', name: 'Salário - Ana', value: 2500, category: 'Salário', dueDate: 5 },
  { id: 'fc-4', name: 'Adobe Creative Cloud', value: 275, category: 'Software', dueDate: 10 },
  { id: 'fc-5', name: 'Internet Fibra', value: 150, category: 'Outros', dueDate: 15 },
];

export const MOCK_VARIABLE_COSTS: VariableCost[] = [
  { id: 'vc-1', description: 'Freelancer - Retoque de Imagens', value: 800, category: 'Freelancer', date: new Date(currentYear, currentMonth, 2).toISOString(), orderId: 'OS-007' },
  { id: 'vc-2', description: 'Compra de props para cenário', value: 350, category: 'Matéria-Prima', date: new Date(currentYear, currentMonth, 5).toISOString(), orderId: 'OS-004' },
  { id: 'vc-3', description: 'Impostos sobre Nota Fiscal', value: 450, category: 'Impostos', date: new Date(currentYear, currentMonth, 10).toISOString(), orderId: 'OS-007' },
  { id: 'vc-4', description: 'Aluguel de Lente Específica', value: 250, category: 'Outros', date: new Date(currentYear, currentMonth, 11).toISOString(), orderId: 'OS-005' },
  { id: 'vc-5', description: 'Freelancer - Food Stylist', value: 600, category: 'Freelancer', date: new Date(currentYear, currentMonth - 1, 15).toISOString() },
  { id: 'vc-6', description: 'Transporte de Equipamento', value: 120, category: 'Outros', date: new Date(currentYear, currentMonth - 1, 20).toISOString() },
];

export const MOCK_REVENUE_ENTRIES: RevenueEntry[] = [
  { id: 'rev-1', description: 'Nike - Campanha de Verão', value: 3500, date: new Date(currentYear, currentMonth, 3).toISOString(), orderId: 'OS-001' },
  { id: 'rev-2', description: 'Adidas - Coleção Outono', value: 2800, date: new Date(currentYear, currentMonth, 7).toISOString(), orderId: 'OS-002' },
  { id: 'rev-3', description: 'Puma - E-commerce', value: 1500, date: new Date(currentYear, currentMonth, 12).toISOString(), orderId: 'OS-003' },
  { id: 'rev-4', description: 'Coca-Cola - Campanha Marketing', value: 5000, date: new Date(currentYear, currentMonth, 14).toISOString(), orderId: 'OS-004' },
  { id: 'rev-5', description: 'Apple - Lançamento', value: 8000, date: new Date(currentYear, currentMonth - 1, 18).toISOString(), orderId: 'OS-005' },
  { id: 'rev-6', description: 'Samsung - Galaxy Fold', value: 7500, date: new Date(currentYear, currentMonth - 1, 25).toISOString(), orderId: 'OS-006' },
  { id: 'rev-7', description: 'Gucci - Bolsas e Sapatos', value: 9500, date: new Date(currentYear, currentMonth - 2, 28).toISOString(), orderId: 'OS-007' },
];

// --- Mock Chat Data ---

export const MOCK_CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'channel-1', name: 'Fotografia Geral', type: ChannelType.Group, members: ['user-1', 'user-2', 'user-3'], unreadCount: 2,
    lastMessage: { id: 'msg-3', channelId: 'channel-1', senderId: 'user-2', senderName: 'Ana (Assistente)', text: 'A luz principal está com defeito, já chamei o técnico.', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
  },
  {
    id: 'channel-2', name: 'Pós-Produção', type: ChannelType.Group, members: ['user-1', 'user-2'], unreadCount: 0,
    lastMessage: { id: 'msg-4', channelId: 'channel-2', senderId: 'user-1', senderName: 'Sandro (Admin)', text: 'As fotos da Nike foram aprovadas!', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
  },
  {
    id: 'channel-3', name: 'Sandro (Admin)', type: ChannelType.Private, members: ['user-1', 'user-2'], unreadCount: 1, // This is Ana's view of the chat with Sandro
    lastMessage: { id: 'msg-5', channelId: 'channel-3', senderId: 'user-1', senderName: 'Sandro (Admin)', text: 'Pode me enviar o relatório do mês?', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() }
  },
   {
    id: 'channel-4', name: 'DZ Bot', type: ChannelType.Private, members: ['user-1', 'user-bot'], unreadCount: 0,
    lastMessage: { id: 'msg-6', channelId: 'channel-4', senderId: 'user-bot', senderName: 'DZ Bot', text: 'Olá! Como posso ajudar hoje?', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
  }
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  // Channel 1: Fotografia Geral
  { id: 'msg-1', channelId: 'channel-1', senderId: 'user-1', senderName: 'Sandro (Admin)', text: 'Pessoal, a câmera 2 precisa de uma nova lente. @Ana (Assistente) pode verificar?', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), mentions: ['user-2'] },
  { id: 'msg-2', channelId: 'channel-1', senderId: 'user-3', senderName: 'Beto (Viewer)', text: 'Vou dar uma olhada agora, Sandro.', timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString() },
  { id: 'msg-3', channelId: 'channel-1', senderId: 'user-2', senderName: 'Ana (Assistente)', text: 'A luz principal está com defeito, já chamei o técnico.', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 'msg-3-reply', channelId: 'channel-1', senderId: 'user-1', senderName: 'Sandro (Admin)', text: 'Ótimo, obrigado Ana!', timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(), replyTo: 'msg-3' },

  // Channel 2: Pós-Produção
  { id: 'msg-4', channelId: 'channel-2', senderId: 'user-1', senderName: 'Sandro (Admin)', text: 'As fotos da Nike foram aprovadas!', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reactions: {
      '👍': ['user-2'],
      '🎉': ['user-1', 'user-2'],
    },
  },

  // Channel 3: Private Sandro & Ana
  { id: 'msg-5', channelId: 'channel-3', senderId: 'user-1', senderName: 'Sandro (Admin)', text: 'Pode me enviar o relatório do mês?', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  
  // Channel 4: Private Sandro & Bot
  { id: 'msg-6', channelId: 'channel-4', senderId: 'user-bot', senderName: 'DZ Bot', text: 'Olá! Como posso ajudar hoje?', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
];