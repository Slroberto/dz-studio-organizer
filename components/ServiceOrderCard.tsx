// Em: src/components/ServiceOrderCard.tsx

import React from 'react';
import { ServiceOrder, OrderStatus, User, UserRole } from '../types';
import { ProgressBar } from './ProgressBar';
import { Trash2, CheckCircle, User as UserIcon, Calendar, Camera } from 'lucide-react';
import { useAppContext } from './AppContext';

interface ServiceOrderCardProps {
  order: ServiceOrder;
  // Removi as props de drag-and-drop e onSelect por enquanto,
  // pois o novo KanbanBoard não as está usando diretamente.
  // Podemos reativá-las depois se precisarmos da funcionalidade de arrastar.
  isRecentlyUpdated?: boolean;
  isFreshlyUpdated?: boolean;
}

const DeadlineIndicator = ({ date, status }: { date?: string, status: OrderStatus }) => {
  if (!date || status === OrderStatus.Delivered) {
    return null;
  }

  const getDeadlineInfo = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let colorClass = 'text-granite-gray';
    if (diffDays < 0) {
      colorClass = 'text-red-500';
    } else if (diffDays <= 1) {
      colorClass = 'text-cadmium-yellow font-bold';
    }

    const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    return { colorClass, formattedDate };
  };

  const { colorClass, formattedDate } = getDeadlineInfo();

  return (
    <div className={`flex items-center text-xs mt-3 ${colorClass}`}>
      <Calendar size={14} className="mr-2 flex-shrink-0" />
      <span>{formattedDate}</span>
    </div>
  );
};

// ### MUDANÇA 1: Removi o 'export' daqui ###
const ServiceOrderCard: React.FC<ServiceOrderCardProps> = ({ order, isRecentlyUpdated, isFreshlyUpdated }) => {
  const { currentUser, deleteOrder } = useAppContext();
  
  const isInteractive = currentUser?.role !== UserRole.Viewer;
  const canDelete = currentUser?.role === UserRole.Admin;

  const getBorderColor = (progress: number) => {
    const p = progress / 100;
    const hue = 60 + p * 5;
    const saturation = p * 100;
    const lightness = 41 + p * 9;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const borderColorStyle = {
    borderColor: getBorderColor(order.progress || 0) // Adicionado '|| 0' para segurança
  };

  const cardClasses = [
    "relative bg-coal-black border-2 border-transparent rounded-lg p-4 mb-3 shadow-lg transition-all duration-300 card-enter-animation",
    isInteractive ? "cursor-pointer hover:shadow-[0_0_15px_2px_rgba(220,255,0,0.2)] hover:-translate-y-1" : "cursor-default"
  ].join(' ');

  return (
    <div
      // Removido draggable e onDragStart por enquanto
      className={cardClasses}
      style={borderColorStyle}
    >
      {isRecentlyUpdated && (
        <div className="absolute top-2 right-2 text-green-400 bg-coal-black rounded-full card-saved-check">
          <CheckCircle size={20} />
        </div>
      )}
      {isFreshlyUpdated && (
         <div 
            className="absolute top-3 left-3 h-2.5 w-2.5 rounded-full bg-cadmium-yellow pulse-indicator-animation"
            title={`Atualizado às ${new Date(order.lastStatusUpdate).toLocaleTimeString('pt-BR')}`}
        ></div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm text-granite-gray-light font-medium">{order.orderNumber}</p>
          <h3 className="font-bold text-lg text-gray-100 truncate" title={order.client}>
            {order.client}
          </h3>
        </div>
        {canDelete && (
          <button 
            onClick={(e) => {
                e.stopPropagation();
                if (order.id) { // Verificação de segurança
                  deleteOrder(order.id)
                }
            }}
            disabled={!canDelete}
            className="text-granite-gray hover:text-red-500 disabled:text-gray-700 disabled:cursor-not-allowed transition-colors flex-shrink-0 ml-2"
            aria-label="Excluir Ordem"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-4 h-10 overflow-hidden">{order.description}</p>
      
      {order.thumbnailUrl && (
          <img src={order.thumbnailUrl} alt={order.description} className="rounded-md mb-4 aspect-video object-cover"/>
      )}
      
      <ProgressBar progress={order.progress || 0} /> {/* Adicionado '|| 0' para segurança */}

      <div className="mt-3 flex items-center justify-between">
         <DeadlineIndicator date={order.expectedDeliveryDate} status={order.status} />
        <div className="flex items-center space-x-4">
            {order.imageCount && order.imageCount > 0 && (
                <div className="flex items-center text-xs text-granite-gray-light" title={`${order.imageCount} imagens`}>
                    <Camera size={14} className="mr-1.5" />
                    <span>{order.imageCount}</span>
                </div>
            )}
            <div className="flex items-center">
                <span className="text-xs font-medium text-granite-gray-light mr-2">{order.responsible}</span>
                <UserIcon size={14} className="text-granite-gray-light" />
            </div>
        </div>
      </div>
    </div>
  );
};

// ### MUDANÇA 2: Adicionei esta linha para criar a exportação padrão ###
export default ServiceOrderCard;
