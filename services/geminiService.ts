import { ServiceOrder, OrderStatus, DailySummaryData } from '../types';

// This service is now fully mocked and does not use any external APIs.

export const generateFinancialInsight = async (kpi: { totalValue: number, deliveredValue: number, openValue: number, overdueCount: number }): Promise<string> => {
    const { deliveredValue, openValue, overdueCount } = kpi;
    
    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
        setTimeout(() => {
            const insight = `
**Análise Financeira (IA Mock):**

**Resumo Financeiro:**
Excelente progresso! Seu faturamento já realizado atingiu **${deliveredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}**. Com **${openValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}** em projetos ainda em andamento, o pipeline para as próximas semanas está robusto.

**Ponto de Atenção:**
Atualmente, há **${overdueCount} projeto${overdueCount === 1 ? '' : 's'} com o prazo vencido**. É recomendável focar na finalização destes para garantir a satisfação do cliente e liberar o faturamento pendente.

**Recomendação Estratégica:**
Continue focando em mover os projetos para a etapa de 'Entregue'. A performance atual é sólida e manter o ritmo garantirá um fluxo de caixa saudável para o estúdio.
            `;
            resolve(insight.trim());
        }, 1200); // Simulate API call latency
    });
};


export const generateSummary = (orders: ServiceOrder[]): Promise<string> => {
  return new Promise((resolve) => {
    // Simulate network latency
    setTimeout(() => {
      const prompt = createPrompt(orders);
      console.log("--- Mock Gemini API Prompt ---");
      console.log(prompt);
      console.log("----------------------------");
      
      const summary = generateMockResponse(orders);
      resolve(summary);
    }, 1500);
  });
};

const createPrompt = (orders: ServiceOrder[]): string => {
  const orderSummary = orders.map(o => `- OS ${o.orderNumber} for ${o.client} is currently in '${o.status}'.`).join('\n');
  return `
    Analyze the following list of ongoing service orders for DZ Studio and provide a brief, encouraging daily summary. 
    Highlight the number of completed projects, projects in final stages (Approval), and new projects.

    Current Orders:
    ${orderSummary}
  `;
};

const generateMockResponse = (orders: ServiceOrder[]): string => {
    const total = orders.length;
    const delivered = orders.filter(o => o.status === 'Entregue').length;
    const waiting = orders.filter(o => o.status === 'Aguardando produto').length;
    const inApproval = orders.filter(o => o.status === 'Aprovação').length;

    return `
Great work today, team! Here's a quick look at our progress:

- ✅ ${delivered} project${delivered === 1 ? '' : 's'} completed and delivered. Fantastic job!
- ⏳ ${inApproval} project${inApproval === 1 ? ' is' : 's are'} in the final approval stage. Almost there!
- 🚀 ${waiting} new project${waiting === 1 ? '' : 's'} just came in. Let's get started!

We're currently managing ${total} active orders. Keep up the amazing momentum!
    `;
};

export const generateDailySummaryData = (orders: ServiceOrder[], userName: string): DailySummaryData => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

    const inProgress = orders.filter(o => o.status !== 'Aguardando produto' && o.status !== 'Entregue').length;
    const delivered = orders.filter(o => o.status === 'Entregue').length;
    const waiting = orders.filter(o => o.status === 'Aguardando produto').length;

    const newOrders = orders.filter(o => new Date(o.creationDate) > twentyFourHoursAgo).length;
    
    const stalledOrders = orders.filter(o => 
        o.status !== 'Entregue' && new Date(o.lastStatusUpdate) < twoDaysAgo
    );
    
    const dueToday = orders.filter(o => 
        o.expectedDeliveryDate && o.expectedDeliveryDate.split('T')[0] === todayStr && o.status !== 'Entregue'
    ).length;
    
    return {
        userName,
        inProgress,
        delivered,
        waiting,
        newOrders,
        stalled: stalledOrders,
        dueToday
    };
};