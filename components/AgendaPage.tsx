import React from 'react';
import { ServiceOrder, OrderStatus } from '../types';
import { useAppContext } from './AppContext';
import { CalendarClock, AlertTriangle, Clock } from 'lucide-react';

interface AgendaPageProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return { text: 'Sem previsão', color: 'text-granite-gray', days: Infinity };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} dias atrasado`, color: 'text-red-400 font-bold', days: diffDays };
    if (diffDays === 0) return { text: 'Entrega hoje', color: 'text-yellow-400 font-bold', days: diffDays };
    if (diffDays <= 7) return { text: `Faltam ${diffDays} dias`, color: 'text-yellow-400', days: diffDays };
    return { text: `Faltam ${diffDays} dias`, color: 'text-gray-400', days: diffDays };
};

export const AgendaPage: React.FC<AgendaPageProps> = ({ onSelectOrder }) => {
    const { orders } = useAppContext();

    const upcomingOrders = orders
        .filter(o => o.expectedDeliveryDate && o.status !== OrderStatus.Delivered)
        .sort((a, b) => new Date(a.expectedDeliveryDate!).getTime() - new Date(b.expectedDeliveryDate!).getTime());

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-full">
            <div className="flex-shrink-0 flex items-center mb-6">
                <CalendarClock size={32} className="text-cadmium-yellow mr-4" />
                <div>
                    <h1 className="text-3xl font-bold font-display">Agenda de Entregas</h1>
                    <p className="text-granite-gray-light">Visualize os próximos prazos e entregas pendentes.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {upcomingOrders.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingOrders.map(order => {
                            const daysInfo = getDaysRemaining(order.expectedDeliveryDate);
                            const borderColor = daysInfo.days < 0 ? 'border-red-500/50' : daysInfo.days <= 7 ? 'border-yellow-500/50' : 'border-granite-gray/20';

                            return (
                                <div 
                                    key={order.id}
                                    onClick={() => onSelectOrder(order)}
                                    className={`flex items-center justify-between p-4 bg-black/20 rounded-lg border-l-4 ${borderColor} cursor-pointer hover:bg-granite-gray/10 transition-colors`}
                                >
                                    <div className="flex items-center min-w-0">
                                        <img src={order.thumbnailUrl} alt={order.client} className="w-16 h-10 object-cover rounded-md mr-4 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-bold text-lg text-white truncate">{order.client}</p>
                                            <p className="text-sm text-granite-gray-light truncate">{order.orderNumber} - {order.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${daysInfo.color}`}>{daysInfo.text}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.expectedDeliveryDate!).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-granite-gray">
                        <Clock size={48} className="mb-4" />
                        <h2 className="text-xl font-bold text-gray-400">Nenhum prazo futuro encontrado</h2>
                        <p className="mt-2">Não há ordens de serviço com previsão de entrega definida.</p>
                    </div>
                )}
            </div>
        </div>
    );
};