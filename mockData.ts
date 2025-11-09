import { ServiceOrder, User, ActivityLogEntry, OrderStatus, UserRole, ActivityActionType, CommercialQuote, QuoteStatus, QuoteItem, CatalogServiceItem, InvoiceStatus, FixedCost, VariableCost, RevenueEntry, ChatChannel, ChannelType, ChatMessage, Opportunity, OpportunityStatus, Freelancer } from './types';

// Helper to create dates relative to today, avoiding timezone issues by setting time to midday UTC.
const getRelativeDate = (dayOffset: number): string => {
  const date = new Date();
  // Set date first to handle month/year rollovers correctly
  date.setDate(date.getDate() + dayOffset);
  // Set time to a consistent point to avoid timezone shifts affecting the date part
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString();
};


export const MOCK_USERS: User[] = [
  {
    id: 'user-1', name: 'Sandro (Admin)', email: 'sandro@dz.studio', picture: 'https://i.pravatar.cc/150?u=sandro', role: UserRole.Admin, password: '123'
  },
  {
    id: 'user-bot', name: 'DZ Bot', email: 'bot@dz.studio', picture: 'https://i.pravatar.cc/150?u=bot', role: UserRole.Assistant, password: '123'
  },
];

export const MOCK_USER: User = MOCK_USERS[0];

export const MOCK_FREELANCERS: Freelancer[] = [
    { 
        id: 'fl-1', name: 'Bruno Marques', email: 'bruno@freela.com', specialty: 'Retoque', 
        rateType: 'hora', rateValue: 120, availability: 'Disponível', 
        portfolioLink: 'https://behance.net/bruno', picture: 'https://i.pravatar.cc/150?u=bruno'
    },
    { 
        id: 'fl-2', name: 'Carla Vianna', email: 'carla@freela.com', specialty: 'Food Styling', 
        rateType: 'dia', rateValue: 800, availability: 'Ocupado', 
        notes: 'Especialista em sobremesas. Agendar com antecedência.', picture: 'https://i.pravatar.cc/150?u=carla'
    },
    { 
        id: 'fl-3', name: 'Ricardo Alves', email: 'ricardo@freela.com', specialty: 'Edição de Vídeo', 
        rateType: 'projeto', rateValue: 3500, availability: 'Disponível', 
        portfolioLink: 'https://vimeo.com/ricardo', picture: 'https://i.pravatar.cc/150?u=ricardo'
    },
];

export const MOCK_ORDERS: ServiceOrder[] = [
  {
    id: 'OS-001', client: 'Nike', orderNumber: 'OS-001', description: 'Fotos de calçados para campanha de verão.', status: 'Aguardando produto',
    progress: 0, thumbnailUrl: 'https://picsum.photos/seed/nike/400/300', responsible: 'Sandro (Admin)',
    expectedDeliveryDate: getRelativeDate(5), lastStatusUpdate: getRelativeDate(-1), creationDate: getRelativeDate(-1), imageCount: 50, value: 3500, costs: 1200, _rowIndex: 2, link: 'https://www.google.com', tasks: [], comments: [],
    priority: 'Média',
    customFields: {
      'cf-1': 'Estúdio A',
      'cf-3': getRelativeDate(5),
    },
    notes: 'Aguardando chegada dos tênis brancos. Previsão para amanhã.',
    files: [],
    shareableToken: 'dz-abc123xyz'
  },
  {
    id: 'OS-002', client: 'Adidas', orderNumber: 'OS-002', description: 'Still de roupas esportivas coleção outono.', status: 'Em foto',
    progress: 16, thumbnailUrl: 'https://picsum.photos/seed/adidas/400/300', responsible: 'Sandro (Admin)',
    expectedDeliveryDate: getRelativeDate(7), lastStatusUpdate: getRelativeDate(0), creationDate: getRelativeDate(-3), imageCount: 30, value: 2800, costs: 1800, _rowIndex: 3, link: '#', tasks: [], comments: [],
    priority: 'Média',
    customFields: {
      'cf-2': true,
      'cf-3': getRelativeDate(7),
    },
    notes: 'Fotógrafo Beto alocado. Usar fundo cinza claro.',
    files: [],
  },
  {
    id: 'OS-003', client: 'Puma', orderNumber: 'OS-003', description: 'Fotos de acessórios para e-commerce.', status: 'Revelação',
    progress: 33, thumbnailUrl: 'https://picsum.photos/seed/puma/400/300', responsible: 'Carlos',
    expectedDeliveryDate: getRelativeDate(3), lastStatusUpdate: getRelativeDate(-1), creationDate: getRelativeDate(-5), imageCount: 120, value: 1500, costs: 450, _rowIndex: 4, link: '#', tasks: [], comments: [],
    priority: 'Baixa',
    customFields: {
      'cf-3': getRelativeDate(3),
    },
    files: [],
  },
  {
    id: 'OS-004', client: 'Coca-Cola', orderNumber: 'OS-004', description: 'Fotos de produto para campanha de marketing.', status: 'Pós-produção',
    progress: 50, thumbnailUrl: 'https://picsum.photos/seed/cocacola/400/300', responsible: 'Sandro (Admin)',
    expectedDeliveryDate: getRelativeDate(10), lastStatusUpdate: getRelativeDate(0), creationDate: getRelativeDate(-10), imageCount: 15, value: 5000, costs: 2200, _rowIndex: 5, link: '#',
    priority: 'Alta',
    tasks: [
        { id: 't-4-1', text: 'Recorte das garrafas', completed: true },
        { id: 't-4-2', text: 'Ajuste de cor e contraste', completed: true },
        { id: 't-4-3', text: 'Remoção de imperfeições', completed: false },
        { id: 't-4-4', text: 'Adicionar reflexos e sombras', completed: false }
    ],
    comments: [
        { id: 'c-4-1', userId: 'user-1', userName: 'Sandro (Admin)', userPicture: 'https://i.pravatar.cc/150?u=sandro', text: 'Atenção aos reflexos na garrafa, precisam parecer naturais.', timestamp: getRelativeDate(0) }
    ],
    customFields: {
      'cf-3': getRelativeDate(10),
      'cf-2': true,
    },
    files: [
      { id: 'file-1', name: 'briefing_campanha.pdf', url: '#', size: 1205820, uploadStatus: 'completed' },
      { id: 'file-2', name: 'referencias_iluminacao.zip', url: '#', size: 15302000, uploadStatus: 'uploading', progress: 65 },
      { id: 'file-3', name: 'logo_vetor.ai', url: '#', size: 850340, uploadStatus: 'failed' },
    ],
    assignedFreelancers: ['fl-1'],
  },
  {
    id: 'OS-005', client: 'Apple', orderNumber: 'OS-005', description: 'Fotos de novos iPhones para lançamento.', status: 'Cromia',
    progress: 67, thumbnailUrl: 'https://picsum.photos/seed/apple/400/300', responsible: 'Sandro (Admin)',
    expectedDeliveryDate: getRelativeDate(1), lastStatusUpdate: getRelativeDate(-2), creationDate: getRelativeDate(-7), imageCount: 25, value: 8000, costs: 6500, _rowIndex: 6, link: '#', tasks: [], comments: [],
    priority: 'Urgente',
    customFields: {
      'cf-3': getRelativeDate(1),
    },
    files: [],
  },
  {
    id: 'OS-006', client: 'Samsung', orderNumber: 'OS-006', description: 'Campanha para o novo Galaxy Fold.', status: 'Aprovação',
    progress: 84, thumbnailUrl: 'https://picsum.photos/seed/samsung/400/300', responsible: 'Sandro (Admin)',
    expectedDeliveryDate: getRelativeDate(2), lastStatusUpdate: getRelativeDate(0), creationDate: getRelativeDate(-12), imageCount: 40, value: 7500, costs: 3000, _rowIndex: 7, link: '#', tasks: [], comments: [],
    priority: 'Alta',
    customFields: {
      'cf-3': getRelativeDate(2),
    },
    proofingGallery: [
        {
            id: 'img-1',
            url: 'https://picsum.photos/seed/samsung-proof1/1200/800',
            comments: [
                { id: 'pc-1', x: 25.5, y: 40.2, text: 'Aumentar o brilho nesta área.', author: 'Cliente', timestamp: getRelativeDate(0), resolved: false },
                { id: 'pc-2', x: 70, y: 65.8, text: 'Remover este risco no produto.', author: 'Cliente', timestamp: getRelativeDate(0), resolved: false },
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
                 { id: 'pc-3', x: 50, y: 50, text: 'Cor do fundo OK!', author: 'Cliente', timestamp: getRelativeDate(0), resolved: true },
            ]
        }
    ],
    files: [],
    assignedFreelancers: ['fl-1', 'fl-3'],
  },
  {
    id: 'OS-007', client: 'Gucci', orderNumber: 'OS-007', description: 'Fotos de bolsas e sapatos de luxo.', status: 'Entregue',
    progress: 100, thumbnailUrl: 'https://picsum.photos/seed/gucci/400/300', responsible: 'Sandro (Admin)',
    deliveryDate: getRelativeDate(-5), expectedDeliveryDate: getRelativeDate(-5), lastStatusUpdate: getRelativeDate(-5), creationDate: getRelativeDate(-15), imageCount: 18, value: 9500, costs: 4000, _rowIndex: 8, link: '#', tasks: [], comments: [],
    priority: 'Alta',
    customFields: {
      'cf-3': getRelativeDate(-5),
    },
    files: [],
    invoice: { invoiceNumber: 'FAT-001', issueDate: getRelativeDate(-5), dueDate: getRelativeDate(25), status: InvoiceStatus.Pago }
  },
   {
    id: 'OS-008', client: 'Magazine Luiza', orderNumber: 'OS-008', description: 'Fotos de eletrodomésticos para o site.', status: 'Entregue',
    progress: 100, thumbnailUrl: 'https://picsum.photos/seed/magalu/400/300', responsible: 'Carlos',
    deliveryDate: getRelativeDate(-1), expectedDeliveryDate: getRelativeDate(-1),
    lastStatusUpdate: getRelativeDate(-1), creationDate: getRelativeDate(-7), imageCount: 75, value: 4000, costs: 1500, _rowIndex: 9, link: '#', tasks: [], comments: [],
    priority: 'Média',
    customFields: {
      'cf-3': getRelativeDate(-1),
    },
    files: [],
    invoice: { invoiceNumber: 'FAT-002', issueDate: getRelativeDate(-1), dueDate: getRelativeDate(29), status: InvoiceStatus.Pendente }
  },
];

export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
    { id: 'log-1', timestamp: getRelativeDate(-7), userId: 'user-1', userName: 'Sandro (Admin)', action: ActivityActionType.Create, orderId: 'OS-008', orderNumber: 'OS-008', clientName: 'Magazine Luiza' },
    { id: 'log-4', timestamp: getRelativeDate(-5), userId: 'user-1', userName: 'Sandro (Admin)', action: ActivityActionType.Complete, orderId: 'OS-007', orderNumber: 'OS-007', clientName: 'Gucci' },
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
      sentDate: getRelativeDate(-5),
      validUntil: getRelativeDate(25),
      items: quote1Items, discountType: 'fixed', discountValue: 200, value: calculateTotal(quote1Items, 'fixed', 200),
      terms: 'Pagamento em 2x. 50% de entrada e 50% na entrega.',
      decisionDate: getRelativeDate(0),
    },
    {
      id: 'Q-002', quoteNumber: 'ORC-2024-052', client: 'Adidas', responsible: 'Sandro (Admin)', status: QuoteStatus.Rejected,
      sentDate: getRelativeDate(-10),
      validUntil: getRelativeDate(20),
      items: quote2Items, discountType: 'percentage', discountValue: 10, value: calculateTotal(quote2Items, 'percentage', 10),
      terms: 'Pagamento à vista com 5% de desconto adicional.',
      decisionDate: getRelativeDate(-2), lossReason: 'Preço',
    },
    {
      id: 'Q-003', quoteNumber: 'ORC-2024-054', client: 'Coca-Cola', responsible: 'Sandro (Admin)', status: QuoteStatus.Negotiating,
      sentDate: getRelativeDate(0), validUntil: getRelativeDate(30),
      items: quote3Items, discountType: 'fixed', discountValue: 0, value: calculateTotal(quote3Items, 'fixed', 0),
      terms: 'Validade da proposta: 30 dias.',
    },
    {
      id: 'Q-004', quoteNumber: 'ORC-2024-055', client: 'Puma', responsible: 'Sandro (Admin)', status: QuoteStatus.Sent,
      sentDate: getRelativeDate(-1),
      validUntil: getRelativeDate(29),
      items: quote4Items, discountType: 'percentage', discountValue: 0, value: calculateTotal(quote4Items, 'percentage', 0),
      terms: 'Material será entregue via Google Drive.',
    },
     {
      id: 'Q-005', quoteNumber: 'ORC-2024-056', client: 'Apple', responsible: 'Sandro (Admin)', status: QuoteStatus.Draft,
      sentDate: getRelativeDate(0), validUntil: getRelativeDate(30),
      items: quote5Items, discountType: 'fixed', discountValue: 0, value: calculateTotal(quote5Items, 'fixed', 0),
      terms: 'A definir.',
    },
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Tratamento de 200 imagens para E-commerce de Moda',
    clientOrSource: 'Workana',
    budget: 1200,
    deadline: getRelativeDate(15),
    link: 'https://www.workana.com/freelancer/71c360426a57037a3dd8d94faa44095c',
    description: 'Necessário tratamento de pele básico, ajuste de cor e remoção de fundo para 200 fotos de modelo em estúdio.',
    status: OpportunityStatus.Prospecting,
    imageUrl: 'https://picsum.photos/seed/fashion/400/200',
  },
  {
    id: 'opp-2',
    title: 'Fotografia de produto para catálogo de joias',
    clientOrSource: 'Indicação - Joalheria Brilho',
    budget: 3500,
    deadline: getRelativeDate(30),
    link: undefined,
    description: 'Fotos still com fundo neutro e algumas ambientadas. Foco em macro e detalhes. Total de 30 peças.',
    status: OpportunityStatus.Contacted,
    imageUrl: 'https://picsum.photos/seed/jewelry/400/200',
  },
  {
    id: 'opp-3',
    title: 'Pós-produção de campanha de beleza',
    clientOrSource: 'Agência Criativa',
    budget: 5000,
    deadline: getRelativeDate(10),
    link: 'https://www.agenciacriativa.com/briefing',
    description: 'Tratamento de pele avançado (Dodge & Burn, Freq. Sep.) para 10 imagens de campanha de cosméticos.',
    status: OpportunityStatus.Negotiating,
    imageUrl: 'https://picsum.photos/seed/beauty/400/200',
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
    id: 'channel-4', name: 'DZ Bot', type: ChannelType.Private, members: ['user-1', 'user-bot'], unreadCount: 0,
    lastMessage: { id: 'msg-6', channelId: 'channel-4', senderId: 'user-bot', senderName: 'DZ Bot', text: 'Olá! Sou o assistente de IA. Mencione-me com **@DZ Bot** para executar comandos.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
  }
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'msg-6', channelId: 'channel-4', senderId: 'user-bot', senderName: 'DZ Bot', text: 'Olá! Sou o assistente de IA. Mencione-me com **@DZ Bot** para executar comandos.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
];