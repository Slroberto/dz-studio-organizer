import { ServiceOrder, OrderStatus, DailySummaryData, CommercialQuote, KanbanColumn, ActionableIntent, Opportunity, CatalogServiceItem } from '../types';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

// Initialize the Gemini client.
// The API key is assumed to be available in process.env.API_KEY as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


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

export const analyzeOpportunityWithAI = async (opportunity: Pick<Opportunity, 'title' | 'description' | 'budget'>): Promise<Opportunity['aiAnalysis'] | null> => {
    try {
        const prompt = `
          Analise a seguinte oportunidade de trabalho para um estúdio de fotografia e pós-produção.
          Título: ${opportunity.title}
          Descrição: ${opportunity.description || 'Nenhuma descrição fornecida.'}
          Orçamento: ${opportunity.budget ? `R$ ${opportunity.budget}` : 'Não informado'}

          Com base nessas informações, forneça uma análise concisa no seguinte formato JSON:
          - summary: Um resumo em uma frase do que o trabalho pede.
          - complexity: A complexidade estimada do trabalho ('Baixa', 'Média', 'Alta').
          - budgetAnalysis: Uma breve análise sobre o orçamento (se está bom, baixo ou se é difícil dizer sem mais detalhes).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: 'Resumo em uma frase do que o trabalho pede.',
                        },
                        complexity: {
                            type: Type.STRING,
                            description: "A complexidade estimada do trabalho: 'Baixa', 'Média' ou 'Alta'.",
                        },
                        budgetAnalysis: {
                            type: Type.STRING,
                            description: 'Uma breve análise sobre o orçamento.',
                        },
                    },
                    required: ["summary", "complexity", "budgetAnalysis"]
                },
            },
        });
        
        const jsonText = response.text.trim();
        const analysisResult = JSON.parse(jsonText);

        // Basic validation
        if (analysisResult && analysisResult.summary && analysisResult.complexity && analysisResult.budgetAnalysis) {
             return analysisResult as Opportunity['aiAnalysis'];
        }
        console.warn("Incomplete analysis from Gemini:", analysisResult);
        return null;
    } catch (error) {
        console.error("Error analyzing opportunity with Gemini:", error);
        return null;
    }
};

export const generateProposalDraft = async (
  opportunity: Opportunity,
  services: CatalogServiceItem[]
): Promise<Partial<CommercialQuote> | null> => {
    try {
        const servicesString = services.map(s => `- ${s.title}: ${s.description} (Preço: R$${s.price})`).join('\n');

        const prompt = `
            Você é um assistente de vendas para um estúdio de fotografia. Sua tarefa é criar um rascunho de orçamento com base em uma oportunidade de trabalho e um catálogo de serviços.
            
            Oportunidade:
            - Título: ${opportunity.title}
            - Descrição: ${opportunity.description || 'N/A'}
            - Orçamento do Cliente (se informado): ${opportunity.budget ? `R$ ${opportunity.budget}` : 'N/A'}

            Catálogo de Serviços Disponíveis:
            ${servicesString}

            Com base nas informações acima, selecione os serviços mais relevantes do catálogo, ajuste as quantidades se necessário, e crie um rascunho de orçamento. Seja realista. Se a descrição pedir algo que não está no catálogo, crie um novo item de serviço com um preço estimado razoável.

            Retorne um objeto JSON com a seguinte estrutura:
            - client: string (o cliente ou fonte da oportunidade).
            - items: array de objetos, onde cada objeto tem:
                - description: string
                - quantity: number
                - unitPrice: number
            - terms: string (sugira termos de pagamento padrão, como '50% de entrada, 50% na entrega').
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        client: { type: Type.STRING },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    quantity: { type: Type.NUMBER },
                                    unitPrice: { type: Type.NUMBER },
                                },
                                required: ["description", "quantity", "unitPrice"]
                            }
                        },
                        terms: { type: Type.STRING }
                    },
                    required: ["client", "items", "terms"]
                },
            },
        });

        const jsonText = response.text.trim();
        const draft = JSON.parse(jsonText);
        
        // Add IDs to items
        const itemsWithIds = draft.items.map((item: any) => ({
            ...item,
            id: `item-${Date.now()}-${Math.random()}`
        }));

        return { ...draft, items: itemsWithIds };

    } catch (error) {
        console.error("Error generating proposal draft with Gemini:", error);
        return null;
    }
};
