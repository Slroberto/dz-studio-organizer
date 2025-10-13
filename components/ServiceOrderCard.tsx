import React from 'react';
import { ServiceOrder, OrderStatus, User, UserRole } from '../types';
import { ProgressBar } from './ProgressBar';
import { Trash2, CheckCircle, User as UserIcon, Calendar, Camera, CheckSquare, MessageSquare, DollarSign } from 'lucide-react';
import { useAppContext } from './AppContext';

interface ServiceOrderCardProps {
  order: ServiceOrder;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, orderId: string) => void;
  onSelect: (order: ServiceOrder) => void;
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
    
    let colorClass = 'text-granite-gray'; // Default: Granite Gray (#69695A)
    if (diffDays < 0) {
      colorClass = 'text-red-500'; // Overdue: Red (#FF3B30)
    } else if (diffDays <= 1) {
      colorClass = 'text-cadmium-yellow font-bold'; // 1 day left: Yellow (#DCFF00)
    }

    const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    return { colorClass, formattedDate };
  };

  const { colorClass, formattedDate } = getDeadlineInfo();

  return (
    <div className={`flex items-center text-xs ${colorClass}`}>
      <Calendar size={14} className="mr-2 flex-shrink-0" />
      <span>{formattedDate}</span>
    </div>
  );
};


export const ServiceOrderCard: React.FC<ServiceOrderCardProps> = ({ order, onDragStart, onSelect, isRecentlyUpdated, isFreshlyUpdated }) => {
  const { currentUser, deleteOrder } = useAppContext();
  
  const isInteractive = currentUser?.role !== UserRole.Viewer;
  const canDelete = currentUser?.role === UserRole.Admin;

  // Interpolate color from Granite Gray (HSL: 60, 0%, 41%) to Cadmium Yellow (HSL: 65, 100%, 50%)
  const getBorderColor = (progress: number) => {
    const p = progress / 100;
    const hue = 60 + p * 5;
    const saturation = p * 100;
    const lightness = 41 + p * 9;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const borderColorStyle = {
    borderColor: getBorderColor(order.progress)
  };

  const cardClasses = [
    "relative bg-coal-black border-2 border-transparent rounded-lg p-4 mb-3 shadow-lg transition-all duration-300 card-enter-animation",
    isInteractive ? "cursor-pointer hover:shadow-[0_0_15px_2px_rgba(220,255,0,0.2)] hover:-translate-y-1" : "cursor-default"
  ].join(' ');

  const completedTasks = order.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = order.tasks?.length || 0;

  return (
    <div
      draggable={isInteractive}
      onDragStart={isInteractive ? (e) => onDragStart(e, order.id) : undefined}
      onClick={isInteractive ? () => onSelect(order) : undefined}
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
         {currentUser?.role === UserRole.Admin && order.value != null && order.value > 0 && (
            <div className="flex items-center text-xs font-bold text-green-400 bg-green-900/50 px-2 py-1 rounded-full">
                <DollarSign size={12} className="mr-1" />
                {order.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-4 h-10 overflow-hidden">{order.description}</p>
      
      {order.thumbnailUrl && (
          <img src={order.thumbnailUrl} alt={order.description} className="rounded-md mb-4 aspect-video object-cover"/>
      )}
      
      <ProgressBar progress={order.progress} />

      <div className="mt-4 flex items-center justify-between text-xs text-granite-gray-light">
         <DeadlineIndicator date={order.expectedDeliveryDate} status={order.status} />
         <div className="flex items-center space-x-3">
            {totalTasks > 0 && (
                <div className="flex items-center" title={`${completedTasks} de ${totalTasks} tarefas concluídas`}>
                    <CheckSquare size={14} className="mr-1.5" />
                    <span>{completedTasks}/{totalTasks}</span>
                </div>
            )}
            {order.comments && order.comments.length > 0 && (
                <div className="flex items-center" title={`${order.comments.length} comentários`}>
                    <MessageSquare size={14} className="mr-1.5" />
                    <span>{order.comments.length}</span>
                </div>
            )}
            {order.imageCount && order.imageCount > 0 && (
                <div className="flex items-center" title={`${order.imageCount} imagens`}>
                    <Camera size={14} className="mr-1.5" />
                    <span>{order.imageCount}</span>
                </div>
            )}
            <div className="flex items-center min-w-0" title={`Responsável: ${order.responsible}`}>
                <UserIcon size={14} className="mr-1.5 flex-shrink-0" />
                <span className="truncate">{order.responsible}</span>
            </div>
         </div>
      </div>
    </div>
  );
};