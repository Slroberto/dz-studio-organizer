// Em: src/api/sheets.ts

import { GOOGLE_SHEETS_ID, GOOGLE_API_KEY, ORDERS_SHEET_NAME } from '../config';
// Caminho corrigido para o seu arquivo de tipos na raiz do projeto
import { ServiceOrder, OrderStatus } from '../types'; 

const SHEET_NAME = ORDERS_SHEET_NAME;

// MAPA DEFINITIVO: Traduz o nome da coluna na planilha para a chave na sua interface ServiceOrder
const headerMapping: { [key: string]: keyof ServiceOrder } = {
  'Número da OS': 'orderNumber', // Usando 'orderNumber' da sua interface
  'Cliente': 'client',
  'Descrição': 'description',
  'URL da Miniatura': 'thumbnailUrl',
  'Status': 'status',
  'Progresso': 'progress',
  'Data de Criação': 'creationDate',
  'Previsão de Entrega': 'expectedDeliveryDate',
  'Data de Entrega': 'deliveryDate',
  'Responsável': 'responsible',
  'Link do Drive': 'link', // Usando 'link' da sua interface
  'Última Atualização de Status': 'lastStatusUpdate',
  'Qtd imagens': 'imageCount',
};

export async function fetchServiceOrders(): Promise<ServiceOrder[]> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${SHEET_NAME}?key=${GOOGLE_API_KEY}`
     );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API do Google:", errorData);
      throw new Error('Falha ao buscar dados da planilha. Verifique permissões e configurações.');
    }

    const data = await response.json();
    const rows: string[][] = data.values || [];

    if (rows.length < 2) return []; // Sem dados

    const headers = rows[0];
    const serviceOrders: ServiceOrder[] = rows.slice(1).map((row, rowIndex) => {
      const order: Partial<ServiceOrder> = {};
      
      headers.forEach((header, index) => {
        const key = headerMapping[header.trim()];
        if (key) {
          (order as any)[key] = row[index];
        }
      });

      // Adiciona um ID único para o React, já que sua interface não tem um 'id' primário
      order.id = `os-${order.orderNumber || rowIndex}`;
      
      // Adiciona o número da linha da planilha para referência futura
      order._rowIndex = rowIndex + 2;

      // Garante que o status seja um valor válido do seu enum
      if (!Object.values(OrderStatus).includes(order.status as OrderStatus)) {
        order.status = OrderStatus.Waiting;
      }

      return order as ServiceOrder;
    });

    console.log("Ordens de Serviço carregadas e mapeadas:", serviceOrders);
    return serviceOrders;

  } catch (error) {
    console.error("Erro detalhado ao buscar ordens:", error);
    throw error;
  }
}
