import React, { useRef, useState, useEffect, useCallback } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { ServiceOrder, User, OrderStatus, UserRole } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from './AppContext';
import { KanbanFilterPanel } from './KanbanFilterPanel';

interface KanbanBoardProps {
  onSelectOrder: (order: ServiceOrder) => void;
  onEditRequest: (order: ServiceOrder) => void;
  onDeleteRequest: (order: ServiceOrder) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onSelectOrder, onEditRequest, onDeleteRequest }) => {
  const { filteredOrders, handleStatusChange, currentUser, kanbanColumns } = useAppContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
    setDraggedOrderId(orderId);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: OrderStatus) => {
    const orderId = e.dataTransfer.getData("orderId");
    handleStatusChange(orderId, newStatus);
    setDraggedOrderId(null);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
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
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if the user is scrolling vertically
      if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        // Prevent the default vertical scroll behavior
        e.preventDefault();
        // Scroll the container horizontally instead
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);


  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -344 : 344; // 320px column + 24px gap
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-shrink-0 px-1">
        <KanbanFilterPanel />
      </div>
      <div className="relative flex-1 -mx-6">
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
          {kanbanColumns.filter(c => c.status !== 'Entregue').map(column => (
            <KanbanColumn
              key={column.status}
              column={column}
              orders={filteredOrders.filter(order => order.status === column.status)}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onSelectOrder={handleSelectOrder}
              onEditRequest={onEditRequest}
              onDeleteRequest={onDeleteRequest}
              draggedOrderId={draggedOrderId}
              onDragEnd={handleDragEnd}
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
    </div>
  );
};