import { ServiceOrder, OrderStatus, DailySummaryData } from '../types';

// This is a mock service that simulates a call to the Gemini API.
// In a real application, this would use the @google/genai library
// to send a prompt and receive a summary.

export const generateFinancialInsight = (kpi: { totalValue: number, deliveredValue: number, openValue: number, overdueCount: number }): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        const { totalValue, deliveredValue, openValue, overdueCount } = kpi;

        let insight = `**Análise Financeira (IA):**\n\n`;
        insight += `Atualmente, o estúdio gerencia **R$ ${totalValue.toFixed(2)}** em projetos. Desse total, **R$ ${deliveredValue.toFixed(2)}** já foram concluídos e entregues, com **R$ ${openValue.toFixed(2)}** em andamento.\n\n`;

        if (overdueCount > 0) {
            insight += `**Ponto de Atenção:** Identificamos **${overdueCount}** projeto(s) em atraso. Focar na finalização destes itens pode acelerar o fluxo de caixa e melhorar a satisfação do cliente.\n\n`;
        } else {
            insight += `**Excelente!** Não há projetos com prazo de entrega vencido. A gestão de tempo está eficiente.\n\n`;
        }

        const conversionRate = totalValue > 0 ? (deliveredValue / totalValue) * 100 : 0;
        insight += `A taxa de conversão de projetos em faturamento está em **${conversionRate.toFixed(1)}%**. Manter o ritmo nas colunas de 'Aprovação' e 'Cromia' é crucial para aumentar este indicador.`;

        resolve(insight);
    }, 1200);
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
    const delivered = orders.filter(o => o.status === OrderStatus.Delivered).length;
    const waiting = orders.filter(o => o.status === OrderStatus.Waiting).length;
    const inApproval = orders.filter(o => o.status === OrderStatus.Approval).length;

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

    const inProgress = orders.filter(o => o.status !== OrderStatus.Waiting && o.status !== OrderStatus.Delivered).length;
    const delivered = orders.filter(o => o.status === OrderStatus.Delivered).length;
    const waiting = orders.filter(o => o.status === OrderStatus.Waiting).length;

    const newOrders = orders.filter(o => new Date(o.lastStatusUpdate) > twentyFourHoursAgo && o.status === OrderStatus.Waiting).length;
    
    const stalledOrders = orders.filter(o => 
        o.status !== OrderStatus.Delivered && new Date(o.lastStatusUpdate) < twoDaysAgo
    );
    
    const dueToday = orders.filter(o => 
        o.expectedDeliveryDate && o.expectedDeliveryDate.split('T')[0] === todayStr && o.status !== OrderStatus.Delivered
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