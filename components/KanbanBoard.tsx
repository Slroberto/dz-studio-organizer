// Em: src/components/KanbanBoard.tsx

import React, { useState, useEffect } from 'react';
import { fetchServiceOrders } from '../api/sheets';
// Caminho corrigido para o seu arquivo de tipos na raiz do projeto
import { ServiceOrder, OrderStatus } from '../types'; 
import ServiceOrderCard from './ServiceOrderCard';
import './KanbanBoard.css';

// Cria as colunas dinamicamente a partir do seu enum OrderStatus!
const KANBAN_COLUMNS = Object.values(OrderStatus);

function KanbanBoard() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchServiceOrders();
        setOrders(data);
      } catch (err) {
        setError('Falha ao carregar as ordens de serviço.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, []);

  if (isLoading) return <div className="loading-message">Carregando quadro...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="kanban-board">
      {KANBAN_COLUMNS.map(columnName => (
        <div key={columnName} className="kanban-column">
          <h2>{columnName}</h2>
          <div className="cards-container">
            {orders
              .filter(order => order.status === columnName)
              .map(order => (
                // A prop 'key' precisa ser única. Usamos o ID que criamos.
                <ServiceOrderCard key={order.id} order={order} />
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
