import React, { useState } from 'react';
import { ServiceOrderCard } from './ServiceOrderCard';
import { ServiceOrder, User, OrderStatus, KanbanColumn as KanbanColumnType } from '../types';
import { useAppContext } from './AppContext';

interface KanbanColumnProps {
  column: KanbanColumnType;
  orders: ServiceOrder[];
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: OrderStatus) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, orderId: string) => void;
  onSelectOrder: (order: ServiceOrder) => void;
  draggedOrderId: string | null;
  onDragEnd: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, orders, onDrop, onDragStart, onSelectOrder, draggedOrderId, onDragEnd }) => {
  const { currentUser, recentlyUpdatedOrderId } = useAppContext();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (currentUser?.role !== 'Viewer') {
      setIsOver(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (currentUser?.role !== 'Viewer') {
      onDrop(e, column.status);
    }
    setIsOver(false);
  };

  const isOrderFreshlyUpdated = (updateTimestamp: string): boolean => {
    const fiveMinutesInMillis = 5 * 60 * 1000;
    const lastUpdate = new Date(updateTimestamp).getTime();
    const now = new Date().getTime();
    return (now - lastUpdate) < fiveMinutesInMillis;
  };

  return (
    <div 
      className={`flex flex-col w-[90vw] md:w-80 flex-shrink-0 h-full rounded-xl transition-colors duration-300 ${isOver ? 'bg-black/40 border-2 border-dashed border-cadmium-yellow' : 'bg-black/20'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className="p-4 border-b-2 border-granite-gray/20 flex items-center justify-between border-t-4 rounded-t-xl"
        style={{ borderTopColor: column.color }}
      >
        <h2 className="font-bold text-gray-300">{column.title}</h2>
        <span className="text-sm font-semibold bg-gray-700 text-gray-300 rounded-full px-2 py-1">{orders.length}</span>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {orders.map(order => (
          <ServiceOrderCard 
            key={order.id}
            order={order}
            onDragStart={onDragStart}
            onSelect={onSelectOrder}
            isRecentlyUpdated={order.id === recentlyUpdatedOrderId}
            isFreshlyUpdated={isOrderFreshlyUpdated(order.lastStatusUpdate)}
            isDragging={order.id === draggedOrderId}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
};