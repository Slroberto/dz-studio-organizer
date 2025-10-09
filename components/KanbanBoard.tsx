import React, { useRef, useState, useEffect, useCallback } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { ServiceOrder, User, OrderStatus, UserRole } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from './AppContext';

interface KanbanBoardProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onSelectOrder }) => {
  const { filteredOrders, handleStatusChange, currentUser, recentlyUpdatedOrderId } = useAppContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: OrderStatus) => {
    const orderId = e.dataTransfer.getData("orderId");
    handleStatusChange(orderId, newStatus);
  };

  const handleSelectOrder = (order: ServiceOrder) => {
    if (currentUser?.role !== UserRole.Viewer) {
      onSelectOrder(order);
    }
  }

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const buffer = 5; // buffer for floating point inaccuracies
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftArrow(scrollLeft > buffer);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - buffer);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      }
    };
  }, [filteredOrders, checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -344 : 344; // 320px column + 24px gap
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  return (
    <div className="relative h-full -mx-6">
       {showLeftArrow && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-coal-black/80 rounded-full border border-granite-gray/50 text-white hover:bg-cadmium-yellow hover:text-coal-black transition-all shadow-lg"
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <div
        ref={scrollContainerRef}
        className="kanban-container flex space-x-6 h-full px-6"
      >
        {KANBAN_COLUMNS.map(column => (
          <KanbanColumn
            key={column.status}
            column={column}
            orders={filteredOrders.filter(order => order.status === column.status)}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onSelectOrder={handleSelectOrder}
          />
        ))}
      </div>
       {showRightArrow && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-coal-black/80 rounded-full border border-granite-gray/50 text-white hover:bg-cadmium-yellow hover:text-coal-black transition-all shadow-lg"
          aria-label="Rolar para a direita"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};