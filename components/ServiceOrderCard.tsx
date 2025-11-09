import React, { useState } from 'react';
import { ServiceOrder, OrderStatus, User, UserRole, InvoiceStatus, Priority } from '../types';
import { ProgressBar } from './ProgressBar';
import { Trash2, CheckCircle, User as UserIcon, Calendar, Camera, CheckSquare, MessageSquare, DollarSign, TrendingUp, Receipt, Type, Hash, Check, Flag, Zap, CalendarCheck, StickyNote, Edit } from 'lucide-react';
import { useAppContext } from './AppContext';

interface ServiceOrderCardProps {
  order: ServiceOrder;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, orderId: string) => void;
  onSelect: (order: ServiceOrder) => void;
  onEditRequest: (order: ServiceOrder) => void;
  onDeleteRequest: (order: ServiceOrder) => void;
  isRecentlyUpdated?: boolean;
  isFreshlyUpdated?: boolean;
  isDragging?: boolean;
  onDragEnd: () => void;
}

const DeadlineIndicator = ({ date, status }: { date?: string, status: OrderStatus }) => {
  if (!date || status === 'Entregue') {
    return null;
  }

  const getDeadlineInfo = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let className = 'text-granite-gray';
    if (diffDays < 0) {
      className = 'text-red-500 font-bold';
    } else if (diffDays <= 2) {
      className = 'text-cadmium-yellow font-bold';
    }

    const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    return { className, formattedDate };
  };

  const { className, formattedDate } = getDeadlineInfo();

  return (
    <div className={`flex items-center text-xs ${className}`}>
      <Calendar size={14} className="mr-2 flex-shrink-0" />
      <span>{formattedDate}</span>
    </div>
  );
};

const PriorityIndicator: React.FC<{ priority?: Priority }> = ({ priority }) => {
    if (!priority) return null;

    const priorityConfig: Record<Priority, { color: string, icon: React.ReactNode, label: string }> = {
        'Urgente': { color: 'bg-red-500/20 text-red-300', icon: <Zap size={12} className="mr-1" />, label: 'Urgente' },
        'Alta': { color: 'bg-orange-500/20 text-orange-300', icon: <Flag size={12} className="mr-1" />, label: 'Alta' },
        'Média': { color: 'bg-yellow-500/20 text-yellow-300', icon: <Flag size={12} className="mr-1 opacity-60" />, label: 'Média' },
        'Baixa': { color: 'bg-blue-500/20 text-blue-300', icon: <Flag size={12} className="mr-1 opacity-40" />, label: 'Baixa' },
    };

    const config = priorityConfig[priority] || priorityConfig['Média'];
    
    return (
        <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${config.color}`} title={`Prioridade: ${priority}`}>
            {config.icon}
            <span>{config.label}</span>
        </div>
    );
};

const ProfitMarginIndicator: React.FC<{ order: ServiceOrder }> = ({ order }) => {
    const value = order.value || 0;
    const costs = order.costs || 0;

    if (value === 0) return null;

    const profit = value - costs;
    const margin = (profit / value) * 100;

    const getMarginInfo = () => {
        if (margin >= 50) {
            return { color: 'bg-green-500/20 text-green-300', label: 'Excelente' };
        } else if (margin >= 25) {
            return { color: 'bg-yellow-500/20 text-yellow-300', label: 'Bom' };
        } else {
            return { color: 'bg-red-500/20 text-red-300', label: 'Baixa' };
        }
    };

    const { color, label } = getMarginInfo();

    return (
        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${color}`} title={`Margem: ${margin.toFixed(1)}% (${label})`}>
            <TrendingUp size={12} className="mr-1" />
            {margin.toFixed(0)}%
        </div>
    );
};

const InvoiceStatusIndicator: React.FC<{ order: ServiceOrder }> = ({ order }) => {
    if (!order.invoice) return null;

    const statusConfig = {
        [InvoiceStatus.Pendente]: { color: 'bg-orange-500/20 text-orange-300', label: 'Pendente' },
        [InvoiceStatus.Pago]: { color: 'bg-green-500/20 text-green-300', label: 'Pago' },
        [InvoiceStatus.Atrasado]: { color: 'bg-red-500/20 text-red-300', label: 'Atrasado' },
    };
    
    const config = statusConfig[order.invoice.status];

    return (
        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${config.color}`} title={`Fatura: ${config.label}`}>
            <Receipt size={12} className="mr-1.5" />
            <span>{config.label}</span>
        </div>
    );
};

const CustomFieldsDisplay: React.FC<{ order: ServiceOrder }> = ({ order }) => {
    const { customFieldDefinitions } = useAppContext();
    if (!order.customFields || Object.keys(order.customFields).length === 0) {
        return null;
    }

    const fieldsToDisplay = customFieldDefinitions
        .filter(def => {
            const value = order.customFields?.[def.id];
            if (value === undefined || value === null) return false;
            // Don't show empty text/number fields or false booleans to reduce clutter
            if (def.type !== 'boolean' && (value === '' || value === 0)) return false;
            if (def.type === 'boolean' && value === false) return false; 
            return true;
        })
        .map(def => {
            const value = order.customFields?.[def.id];
            let displayValue: React.ReactNode;
            let icon: React.ReactNode;

            switch (def.type) {
                case 'text':
                    icon = <Type size={12} />;
                    displayValue = `${def.name}: ${String(value)}`;
                    break;
                case 'number':
                    icon = <Hash size={12} />;
                    displayValue = `${def.name}: ${String(value)}`;
                    break;
                case 'boolean':
                    icon = <Check size={12} className="text-green-400" />;
                    displayValue = def.name;
                    break;
                case 'date':
                    icon = <Calendar size={12} />;
                    displayValue = `${def.name}: ${new Date(String(value)).toLocaleDateString('pt-BR')}`;
                    break;
                default:
                    return null;
            }
            
            return (
                <div key={def.id} className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full" title={String(displayValue)}>
                    {icon}
                    <span className="truncate text-gray-300 font-medium">{displayValue}</span>
                </div>
            );
        });

    if (fieldsToDisplay.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-granite-gray/20 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {fieldsToDisplay}
        </div>
    );
};


export const ServiceOrderCard: React.FC<ServiceOrderCardProps> = ({ order, onDragStart, onSelect, onEditRequest, onDeleteRequest, isRecentlyUpdated, isFreshlyUpdated, isDragging, onDragEnd }) => {
  const { currentUser } = useAppContext();
  const [isNoteTooltipVisible, setIsNoteTooltipVisible] = useState(false);
  
  const isInteractive = currentUser?.role !== UserRole.Viewer;
  const isAdmin = currentUser?.role === UserRole.Admin;

  const getPriorityPulseClass = (priority?: Priority): string => {
    switch (priority) {
        case 'Urgente':
            return 'urgent-pulse-animation';
        case 'Alta':
            return 'alta-pulse-animation';
        default:
            return '';
    }
  };

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
    "relative bg-coal-black border-2 border-transparent rounded-lg p-4 mb-3 shadow-lg transition-all duration-300 card-enter-animation group",
    isInteractive ? "cursor-pointer hover:shadow-[0_0_15px_2px_rgba(220,255,0,0.2)] hover:-translate-y-1" : "cursor-default",
    isDragging ? "opacity-50 transform rotate-3 scale-105 shadow-2xl shadow-black" : "",
    getPriorityPulseClass(order.priority)
  ].join(' ');

  const completedTasks = order.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = order.tasks?.length || 0;

  return (
    <div
      draggable={isInteractive}
      onDragStart={isInteractive ? (e) => onDragStart(e, order.id) : undefined}
      onDragEnd={isInteractive ? onDragEnd : undefined}
      onClick={isInteractive ? () => onSelect(order) : undefined}
      className={cardClasses}
      style={borderColorStyle}
    >
      {isInteractive && (
          <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={(e) => { e.stopPropagation(); onEditRequest(order); }} title="Editar OS" className="p-1.5 bg-coal-black/50 rounded-full text-gray-300 hover:text-cadmium-yellow hover:bg-black/80"><Edit size={14}/></button>
              {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(order); }} title="Excluir OS" className="p-1.5 bg-coal-black/50 rounded-full text-gray-300 hover:text-red-500 hover:bg-black/80"><Trash2 size={14}/></button>}
          </div>
      )}
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
         <div className="flex items-center gap-2">
            <PriorityIndicator priority={order.priority} />
            {isAdmin && order.invoice && <InvoiceStatusIndicator order={order} />}
            {isAdmin && order.value != null && order.value > 0 && <ProfitMarginIndicator order={order} />}
         </div>
      </div>
      <p className="text-sm text-gray-400 mb-4 h-10 overflow-hidden">{order.description}</p>
      
      {order.thumbnailUrl && (
          <img src={order.thumbnailUrl} alt={order.description} className="rounded-md mb-4 aspect-video object-cover"/>
      )}
      
      <ProgressBar progress={order.progress} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 text-xs text-granite-gray-light">
         <DeadlineIndicator date={order.expectedDeliveryDate} status={order.status} />
         <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {order.notes && (
                 <div className="relative" onMouseEnter={() => setIsNoteTooltipVisible(true)} onMouseLeave={() => setIsNoteTooltipVisible(false)}>
                    <StickyNote size={14} className="text-yellow-400/80" />
                    {isNoteTooltipVisible && (
                        <div className="absolute bottom-full mb-2 -right-1/2 translate-x-1/2 w-60 p-2 bg-black border border-granite-gray/50 rounded-md shadow-lg z-20 text-sm text-gray-200 whitespace-pre-wrap pointer-events-none">
                            <h4 className="font-bold text-yellow-300 mb-1">Anotação</h4>
                            {order.notes}
                        </div>
                    )}
                </div>
            )}
            {order.expectedDeliveryDate && (
              <div className="flex items-center text-green-400" title="Sincronizado com o calendário">
                <CalendarCheck size={14} />
              </div>
            )}
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
      <CustomFieldsDisplay order={order} />
    </div>
  );
};