
import React, { useState, useMemo } from 'react';
import { useAppContext } from './AppContext';
import { ServiceOrder, NotificationColorType } from '../types';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface ProfitabilityDashboardProps {
    onSelectOrder: (order: ServiceOrder) => void;
}

const OrderProfitCard: React.FC<{
    order: ServiceOrder & { profit: number; margin: number };
    onQuickMove: (order: ServiceOrder) => void;
    canMove: boolean;
    onSelectOrder: (order: ServiceOrder) => void;
}> = ({ order, onQuickMove, canMove, onSelectOrder }) => {
    const { profit, margin } = order;

    let marginColor = 'text-gray-400';
    if (margin > 50) marginColor = 'text-green-400';
    else if (margin > 25) marginColor = 'text-yellow-400';
    else if (margin > 0) marginColor = 'text-orange-400';
    else if (margin < 0) marginColor = 'text-red-400';
    
    return (
        <div 
            onClick={() => onSelectOrder(order)}
            className="bg-coal-black p-4 rounded-lg border border-granite-gray/20 flex items-center justify-between gap-4 group cursor-pointer hover:border-cadmium-yellow/50 transition-colors duration-200"
        >
            <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{order.client}</p>
                <p className="text-sm text-granite-gray-light">{order.orderNumber} - {order.status}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
                <div className="text-right w-28">
                    <p className="text-xs text-granite-gray-light">Lucro</p>
                    <p className={`font-bold text-lg ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="text-right w-20">
                    <p className="text-xs text-granite-gray-light">Margem</p>
                    <p className={`font-bold text-lg ${marginColor}`}>{margin.toFixed(1)}%</p>
                </div>
            </div>
            {canMove && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onQuickMove(order); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/80 text-white rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform hover:bg-blue-500 active:scale-95"
                    title="Mover para 'Em Foto'"
                >
                    Mover para Foto <ArrowRight size={14} />
                </button>
            )}
        </div>
    );
};


export const ProfitabilityDashboard: React.FC<ProfitabilityDashboardProps> = ({ onSelectOrder }) => {
    const { orders, updateOrder, addNotification, kanbanColumns } = useAppContext();
    const [sortBy, setSortBy] = useState<'profitDesc' | 'profitAsc' | 'marginDesc' | 'marginAsc'>('profitDesc');

    const statusOrder = useMemo(() => {
        const orderMap = new Map<string, number>();
        kanbanColumns.forEach((col, index) => {
            orderMap.set(col.status, index);
        });
        return orderMap;
    }, [kanbanColumns]);

    const emFotoIndex = statusOrder.get('Em foto') ?? Infinity;

    const profitableOrders = useMemo(() => {
        const calculated = orders.map(order => {
            const value = order.value || 0;
            const costs = order.costs || 0;
            const profit = value - costs;
            const margin = value > 0 ? (profit / value) * 100 : 0;
            return { ...order, profit, margin };
        });

        return calculated.sort((a, b) => {
            switch (sortBy) {
                case 'profitAsc': return a.profit - b.profit;
                case 'marginDesc': return b.margin - a.margin;
                case 'marginAsc': return a.margin - b.margin;
                case 'profitDesc':
                default:
                    return b.profit - a.profit;
            }
        });
    }, [orders, sortBy]);
    
    const handleQuickMove = async (order: ServiceOrder) => {
        const newStatus = 'Em foto';
        if (order.status === newStatus) return;

        const columnsForProgress = kanbanColumns.filter(c => c.status !== 'Entregue');
        const columnIndex = columnsForProgress.findIndex(c => c.status === newStatus);
        let progress = 0;
        if (columnIndex !== -1 && columnsForProgress.length > 0) {
          progress = Math.round(((columnIndex + 1) / columnsForProgress.length) * 99);
        }
        
        const updatedOrder: ServiceOrder = {
            ...order,
            status: newStatus,
            progress: progress,
            lastStatusUpdate: new Date().toISOString(),
        };
        
        await updateOrder(updatedOrder);
        addNotification({ message: `OS ${updatedOrder.orderNumber} movida para ${newStatus}.`, type: NotificationColorType.Success, orderId: updatedOrder.id });
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-shrink-0 flex justify-between items-center">
                <h1 className="text-xl font-bold font-display flex items-center gap-3"><TrendingUp size={24}/> Rentabilidade por OS</h1>

                <div className="flex items-center gap-2">
                    <label htmlFor="sortBy" className="text-sm font-medium text-granite-gray-light">Ordenar por:</label>
                    <select 
                        id="sortBy"
                        value={sortBy} 
                        onChange={e => setSortBy(e.target.value as any)}
                        className="bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-1.5 text-sm"
                    >
                        <option value="profitDesc">Maior Lucro</option>
                        <option value="profitAsc">Menor Lucro</option>
                        <option value="marginDesc">Maior Margem</option>
                        <option value="marginAsc">Menor Margem</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {profitableOrders.map(order => (
                    <OrderProfitCard
                        key={order.id}
                        order={order}
                        onQuickMove={handleQuickMove}
                        canMove={(statusOrder.get(order.status) ?? Infinity) < emFotoIndex}
                        onSelectOrder={onSelectOrder}
                    />
                ))}
            </div>
        </div>
    );
};
