import { ServiceOrder, OrderStatus, DailySummaryData } from '../types';

// The GoogleGenAI import is removed to prevent loading errors.

export const generateFinancialInsight = async (kpi: { totalValue: number, deliveredValue: number, openValue: number, overdueCount: number }): Promise<string> => {
    console.log("--- MOCK Gemini API for Financial Insight ---");
    console.log("KPIs received:", kpi);
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const formattedDeliveredValue = kpi.deliveredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return `
**Resumo Financeiro:**
A saúde financeira parece estável. O faturamento realizado de **${formattedDeliveredValue}** é um bom sinal, mas há um valor considerável em projetos abertos.

**Ponto de Atenção:**
O principal ponto de atenção são os **${kpi.overdueCount} projetos atrasados**. Atrasos podem impactar o fluxo de caixa e a satisfação do cliente.

**Recomendação Estratégica:**
Priorize a finalização dos projetos atrasados para converter o "Valor em Aberto" em faturamento o mais rápido possível.
`;
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