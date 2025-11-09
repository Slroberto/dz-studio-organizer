import { ServiceOrder, OrderStatus, DailySummaryData, CommercialQuote, KanbanColumn, ActionableIntent, Opportunity, CatalogServiceItem } from '../types';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

// Safely access the API key from environment variables, providing a fallback for browser environments
// where `process` is not defined. This prevents the app from crashing.
const apiKey = typeof process !== 'undefined' && process.env.API_KEY ? process.env.API_KEY : '';

// Initialize the Gemini client.
const ai = new GoogleGenAI({ apiKey });


export const generateFinancialInsight = async (kpi: { totalValue: number, deliveredValue: number, openValue: number, overdueCount: number }): Promise<string> => {
    // This function is kept as a mock as the user's request was about the chat bot.
    console.log("--- MOCK Gemini API for Financial Insight ---");
    console.log("KPIs received:", kpi);
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
    // This function is kept as a mock.
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = orders.length;
      const delivered = orders.filter(o => o.status === 'Entregue').length;
      const waiting = orders.filter(o => o.status === 'Aguardando produto').length;
      const inApproval = orders.filter(o => o.status === 'Aprovação').length;

      resolve(`
Great work today, team! Here's a quick look at our progress:

- ✅ ${delivered} project${delivered === 1 ? '' : 's'} completed and delivered. Fantastic job!
- ⏳ ${inApproval} project${inApproval === 1 ? ' is' : 's are'} in the final approval stage. Almost there!
- 🚀 ${waiting} new project${waiting === 1 ? '' : 's'} just came in. Let's get started!

We're currently managing ${total} active orders. Keep up the amazing momentum!
      `);
    }, 1500);
  });
};

export const generateDailySummaryData = (orders: ServiceOrder[], userName: string): DailySummaryData => {
    // This function is kept as a mock.
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
        userName, inProgress, delivered, waiting, newOrders, stalled: stalledOrders, dueToday
    };
};

interface BotContext {
    orders: ServiceOrder[];
    quotes: CommercialQuote[];
    kanbanColumns: KanbanColumn[];
}

/**
 * Calls the Gemini API to get a response from the DZ Bot based on user message and context.
 */
export const getBotResponse = async (message: string, context: BotContext): Promise<string> => {
    try {
        const systemInstruction = `Você é o DZ Bot, um assistente inteligente para o aplicativo DZ Studio Organizer. Sua função é ajudar os usuários a gerenciar ordens de serviço (OS), orçamentos e obter informações sobre o fluxo de trabalho do estúdio. Responda em português do Brasil. Você receberá a pergunta do usuário e um contexto da aplicação em JSON. Use o contexto para formular sua resposta. Seja conciso e use markdown para formatação (negrito, listas, e blocos de código para e-mails).`;
        
        const content = `
Contexto da aplicação:
${JSON.stringify(context)}

---

Pergunta do usuário:
"${message}"
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: content,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error getting bot response from Gemini:", error);
        return "Desculpe, não consegui processar sua solicitação no momento. Ocorreu um erro ao conectar com a IA. Verifique o console para mais detalhes.";
    }
};

const changeStatusTool: FunctionDeclaration = {
    name: 'change_order_status',
    description: 'Identifica a intenção de mover uma Ordem de Serviço (OS) para a próxima etapa, com base em palavras-chave como "finalizei", "terminei" ou "concluí".',
    parameters: {
        type: Type.OBJECT,
        properties: {
            orderNumber: {
                type: Type.STRING,
                description: 'O número da OS a ser atualizada, extraído da mensagem. Ex: "OS-004".',
            },
        },
        required: ['orderNumber'],
    },
};

const createTasksTool: FunctionDeclaration = {
    name: 'create_tasks_for_order',
    description: 'Identifica a intenção de criar uma ou mais tarefas para uma Ordem de Serviço (OS) específica.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            orderNumber: {
                type: Type.STRING,
                description: 'O número da OS onde as tarefas serão adicionadas. Ex: "OS-001".',
            },
            tasks: {
                type: Type.ARRAY,
                description: 'Uma lista de textos das tarefas a serem criadas.',
                items: { type: Type.STRING },
            },
        },
        required: ['orderNumber', 'tasks'],
    },
};

/**
 * Analyzes a message for actionable intents using Gemini function calling.
 */
export const analyzeMessageForIntent = async (message: string, context: BotContext): Promise<ActionableIntent | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
                tools: [{ functionDeclarations: [changeStatusTool, createTasksTool] }],
            },
        });

        if (!response.functionCalls || response.functionCalls.length === 0) {
            return null;
        }

        const functionCall = response.functionCalls[0];

        if (functionCall.name === 'change_order_status') {
            const { orderNumber } = functionCall.args as { orderNumber: string };
            const order = context.orders.find(o => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
            if (!order) return null;

            const currentStatusIndex = context.kanbanColumns.findIndex(c => c.status === order.status);
            const canMove = currentStatusIndex > -1 && currentStatusIndex < context.kanbanColumns.length - 2;

            if (canMove) {
                const nextStatus = context.kanbanColumns[currentStatusIndex + 1];
                return {
                    intent: 'CHANGE_STATUS',
                    parameters: { orderNumber: order.orderNumber, newStatus: nextStatus.status },
                    message: `Detectei que você finalizou uma etapa. Deseja mover a ${order.orderNumber} para "${nextStatus.title}"?`
                };
            }
        }
        
        if (functionCall.name === 'create_tasks_for_order') {
             const { orderNumber, tasks } = functionCall.args as { orderNumber: string, tasks: string[] };
             const order = context.orders.find(o => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
             if (!order || !tasks || tasks.length === 0) return null;
             
             return {
                intent: 'CREATE_TASK',
                parameters: { orderNumber: order.orderNumber, tasks },
                message: `Deseja adicionar ${tasks.length} tarefa(s) para a ${order.orderNumber}?`
            };
        }

        return null;
    } catch (error) {
        console.error("Error analyzing message for intent with Gemini:", error);
        return null;
    }
};

export const analyzeOpportunityWithAI = async (opportunity: Opportunity): Promise<string> => {
    try {
        const systemInstruction = "Você é um analista de projetos sênior especializado em avaliar oportunidades de trabalho para estúdios de fotografia e pós-produção. Sua análise deve ser concisa, direta e em formato markdown.";
        const prompt = `
Analise a seguinte oportunidade de trabalho e forneça um resumo dos pontos-chave.

**Título:** ${opportunity.title}
**Fonte/Cliente:** ${opportunity.clientOrSource}
**Orçamento:** ${opportunity.budget ? opportunity.budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}
**Descrição:** ${opportunity.description}

Sua análise deve incluir:
- **Resumo Rápido:** Uma frase resumindo o trabalho.
- **Prós:** Pontos positivos (orçamento, escopo, tipo de trabalho).
- **Contras/Riscos:** Pontos de atenção ou possíveis problemas.
- **Habilidades Chave:** Liste as 2-3 habilidades mais importantes para ter sucesso.
`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing opportunity with AI:", error);
        return "Erro ao analisar a vaga. A IA não está disponível no momento.";
    }
};

export const analyzeClientProfileWithAI = async (opportunity: Opportunity): Promise<string> => {
    try {
        const systemInstruction = "Você é um consultor de negócios que analisa perfis de clientes em plataformas de freelancers. Sua análise deve ser concisa e útil, em formato markdown.";
        const prompt = `
Analise o perfil do cliente/fonte: **${opportunity.clientOrSource}**.

Considerando a fonte, descreva:
- **Perfil Típico:** Como costumam ser os clientes desta plataforma/fonte (ex: agências, startups, clientes finais)?
- **Foco da Negociação:** O que é mais importante para eles (preço, prazo, qualidade)?
- **Dica de Abordagem:** Uma dica rápida sobre como se comunicar ou apresentar a proposta para este perfil.
`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing client profile with AI:", error);
        return "Erro ao analisar o perfil. A IA não está disponível no momento.";
    }
};

export const generateProposalDraft = async (opportunity: Opportunity): Promise<string> => {
    try {
        const systemInstruction = "Você é um redator de propostas comerciais (copywriter) para um estúdio de fotografia. Você escreve de forma amigável, profissional e persuasiva. A proposta deve ser em markdown.";
        const prompt = `
Crie um rascunho de proposta para a seguinte oportunidade:

**Título:** ${opportunity.title}
**Descrição:** ${opportunity.description}

A proposta deve:
1. Começar com uma saudação amigável.
2. Mostrar que você entendeu a necessidade do cliente.
3. Destacar brevemente por que o DZ Studio é a escolha certa.
4. Concluir com uma chamada para ação (call to action) para discutir os detalhes.
`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating proposal draft with AI:", error);
        return "Erro ao gerar a proposta. A IA não está disponível no momento.";
    }
};