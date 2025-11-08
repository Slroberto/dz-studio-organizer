import { ServiceOrder, OrderStatus, DailySummaryData, CommercialQuote, KanbanColumn, ActionableIntent } from '../types';

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

// --- [NEW] Gemini Service for Chat Bot ---

interface BotContext {
    orders: ServiceOrder[];
    quotes: CommercialQuote[];
    kanbanColumns: KanbanColumn[];
}

/**
 * Simulates a call to the Gemini API with function calling for the chat bot.
 */
export const getBotResponse = async (message: string, context: BotContext): Promise<string> => {
    console.log(`[MOCK Gemini Service] Received command: "${message}"`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network latency

    const lowerMessage = message.toLowerCase();

    // 1. Function Call Simulation: Get Order Status
    if (lowerMessage.includes('status') && /os-\d+/.test(lowerMessage)) {
        const orderNumber = lowerMessage.match(/os-\d+/)?.[0].toUpperCase();
        const order = context.orders.find(o => o.orderNumber === orderNumber);
        
        if (order) {
            const column = context.kanbanColumns.find(c => c.status === order.status);
            return `**Status da OS ${order.orderNumber} (${order.client}):**\n` +
                   `- **Status Atual:** ${column?.title || order.status}\n` +
                   `- **Responsável:** ${order.responsible || 'N/A'}\n` +
                   `- **Previsão de Entrega:** ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'N/A'}`;
        }
        return `OS "**${orderNumber}**" não encontrada.`;
    }

    // 2. NEW (Phase 3): Writing Assistant
    const emailMatch = lowerMessage.match(/escreva um email para o cliente da (os-\d+) avisando que (.*)/);
    if (emailMatch) {
        const orderNumber = emailMatch[1].toUpperCase();
        const reason = emailMatch[2];
        const order = context.orders.find(o => o.orderNumber === orderNumber);
        if (order) {
            return `Claro! Aqui está um rascunho de e-mail que você pode copiar e ajustar:\n\n` +
                   "```\n" +
                   `Assunto: Atualização sobre a OS ${order.orderNumber} - ${order.client}\n\n` +
                   `Olá ${order.client},\n\n` +
                   `Escrevo para fornecer uma atualização sobre o seu projeto (OS ${order.orderNumber}).\n` +
                   `No momento, ${reason}.\n\n` +
                   `Manteremos você informado sobre os próximos passos.\n\n` +
                   `Atenciosamente,\n` +
                   `${order.responsible || 'Equipe DZ Studio'}\n` +
                   "```";
        }
        return `Não encontrei a OS **${orderNumber}** para redigir o e-mail.`;
    }

    // 3. NEW (Phase 3): Generate Order Summary
    const summaryMatch = lowerMessage.match(/resume para (os-\d+)/);
    if (summaryMatch) {
        const orderNumber = summaryMatch[1].toUpperCase();
        const order = context.orders.find(o => o.orderNumber === orderNumber);
        if (order) {
            const completedTasks = order.tasks?.filter(t => t.completed).length || 0;
            const totalTasks = order.tasks?.length || 0;
            const lastComment = order.comments?.[order.comments.length - 1];

            let summaryText = `A **OS ${order.orderNumber}** para o cliente **${order.client}** está atualmente na fase de **${order.status}**.`;
            if (totalTasks > 0) {
                summaryText += ` Das ${totalTasks} tarefas, ${completedTasks} foram concluídas.`;
            } else {
                summaryText += " Nenhuma tarefa foi adicionada a esta OS ainda.";
            }
            if (lastComment) {
                summaryText += ` O comentário mais recente de ${lastComment.userName} é: "${lastComment.text}".`;
            }
            if (order.expectedDeliveryDate) {
                 summaryText += ` A previsão de entrega é ${new Date(order.expectedDeliveryDate).toLocaleDateString('pt-BR')}.`;
            }
            return `Aqui está o resumo da **OS ${orderNumber}**:\n\n${summaryText}`;
        }
        return `OS "**${orderNumber}**" não encontrada para resumir.`;
    }
    
    // 4. NEW (Phase 3): Natural Language Reports
    if (lowerMessage.includes('faturamento da última semana')) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const revenue = context.orders
            .filter(o => o.status === 'Entregue' && o.deliveryDate && new Date(o.deliveryDate) > oneWeekAgo)
            .reduce((sum, o) => sum + (o.value || 0), 0);
        return `Com base nas Ordens de Serviço entregues, o faturamento da última semana foi de **${revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}**.`;
    }

    const deliveryCountMatch = lowerMessage.match(/quantas os foram entregues em (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/);
    if (deliveryCountMatch) {
        const monthName = deliveryCountMatch[1];
        const monthIndex = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'].indexOf(monthName);
        const currentYear = new Date().getFullYear();
        
        const count = context.orders.filter(o => {
            if (o.status !== 'Entregue' || !o.deliveryDate) return false;
            const deliveryDate = new Date(o.deliveryDate);
            return deliveryDate.getMonth() === monthIndex && deliveryDate.getFullYear() === currentYear;
        }).length;

        return `Em **${monthName.charAt(0).toUpperCase() + monthName.slice(1)}**, foram entregues **${count}** Ordens de Serviço.`;
    }

    // 5. Existing: Find Quotes for a client
    if (lowerMessage.includes('orçamento') || lowerMessage.includes('orcamento')) {
        const clientName = lowerMessage.replace(/orçamentos? para/i, '').replace(/orçamentos?/i, '').trim();
        const results = context.quotes.filter(q => q.client.toLowerCase().includes(clientName.toLowerCase()));

        if (results.length > 0) {
            return `Encontrei **${results.length}** orçamento(s) para "**${clientName}**":\n` +
                   results.slice(0, 5).map(q => `- **${q.quoteNumber}** (${q.status}): ${q.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`).join('\n');
        }
        return `Nenhum orçamento encontrado para "**${clientName}**".`;
    }

    // 6. Existing: Create Tasks
    if (lowerMessage.startsWith('crie') && (lowerMessage.includes('tarefa') || lowerMessage.includes('task'))) {
        const osMatch = lowerMessage.match(/os-\d+/);
        if (osMatch) {
            const orderNumber = osMatch[0].toUpperCase();
            const order = context.orders.find(o => o.orderNumber === orderNumber);
            if (order) {
                const tasksText = lowerMessage.split(':')[1];
                const tasks = tasksText ? tasksText.split(',').map(t => t.trim()) : [];
                if (tasks.length > 0) {
                    // In a real scenario, you would call `appContext.addTask` here
                    return `Ok, simulando a criação de **${tasks.length}** tarefas para a **${orderNumber}**:\n` +
                           tasks.map(t => `- [ ] ${t}`).join('\n');
                }
            } else {
                return `Não encontrei a OS **${orderNumber}** para adicionar as tarefas.`;
            }
        }
    }

    // 7. Fallback "Generative" response
    return 'Desculpe, não entendi o comando. Tente algo como:\n' +
           '- "**status da OS-001**"\n' +
           '- "**orçamentos para a Nike**"\n' +
           '- "**resume para OS-004**"\n' +
           '- "**qual foi o faturamento da última semana?**"\n' +
           '- "**escreva um email para o cliente da OS-006 avisando que as fotos estão em aprovação.**"';
};

// --- [NEW] Gemini Service for Proactive Suggestions ---

/**
 * Simulates analyzing a message for actionable intents.
 */
export const analyzeMessageForIntent = async (message: string, context: BotContext): Promise<ActionableIntent | null> => {
    console.log(`[MOCK Gemini Intent Analysis] Analyzing: "${message}"`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate analysis latency

    const lowerMessage = message.toLowerCase();
    
    // Regex to find OS numbers (e.g., "os-004", "OS-123")
    const osMatch = lowerMessage.match(/os-\d+/);
    const orderNumber = osMatch ? osMatch[0].toUpperCase() : null;

    if (!orderNumber) return null;

    const order = context.orders.find(o => o.orderNumber === orderNumber);
    if (!order) return null;
    
    // Intent 1: Change Status
    const statusKeywords = ['finalizei', 'terminei', 'concluí', 'entreguei', 'acabei de finalizar'];
    if (statusKeywords.some(kw => lowerMessage.includes(kw))) {
        const currentStatusIndex = context.kanbanColumns.findIndex(c => c.status === order.status);
        // Can move if not the last or second-to-last column ('Entregue')
        const canMove = currentStatusIndex > -1 && currentStatusIndex < context.kanbanColumns.length - 2;
        
        if (canMove) {
            const nextStatus = context.kanbanColumns[currentStatusIndex + 1];
            return {
                intent: 'CHANGE_STATUS',
                parameters: { orderNumber: order.orderNumber, newStatus: nextStatus.status },
                message: `Deseja mover a ${order.orderNumber} para "${nextStatus.title}"?`
            };
        }
    }

    // Intent 2: Create Task
    const taskKeywords = ['adicionar tarefa', 'crie a tarefa', 'precisamos fazer'];
    if (taskKeywords.some(kw => lowerMessage.includes(kw)) && lowerMessage.includes(':')) {
        const tasksText = lowerMessage.split(':')[1];
        if (tasksText) {
            const tasks = tasksText.split(',').map(t => t.trim()).filter(Boolean);
            if (tasks.length > 0) {
                 return {
                    intent: 'CREATE_TASK',
                    parameters: { orderNumber, tasks },
                    message: `Adicionar ${tasks.length} tarefa(s) para a ${orderNumber}?`
                };
            }
        }
    }

    return null;
};