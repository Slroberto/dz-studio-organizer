import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ServiceOrder, User, OrderStatus, UserRole, KanbanColumn } from '../types';
import { BarChart3, Package, CheckCircle, Clock, AlertTriangle, CalendarDays, BarChartHorizontal, FileDown, Bot, Loader, DollarSign, PiggyBank, Receipt, Lightbulb, ChevronDown, LogOut } from 'lucide-react';
import { useAppContext } from './AppContext';
import { FinancialInsightModal } from './FinancialInsightModal';
import { generateFinancialInsight } from '../services/geminiService';

// This lets TypeScript know that `Chart` will be available on the global scope
declare const Chart: any;

// Custom Hook for count-up animation
const useCountUp = (end: number, isCurrency = false, duration = 1500) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    
    useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = (frame / totalFrames);
            const currentCount = end * progress;
            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
                 setCount(end); // Ensure final value is exact
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, duration, totalFrames]);
    
    if (isCurrency) {
        return count.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'});
    }
    return Math.round(count);
};


// Stat Card Component (Redesigned)
const StatCard = ({ title, value, valueColor = 'text-white', icon, bgColor, iconContainerClass, isCurrency = false }: { title: string, value: number, valueColor?: string, icon: React.ReactElement, iconContainerClass: string, bgColor: string, isCurrency?: boolean }) => {
    const animatedValue = useCountUp(value, isCurrency);
    return (
        <div className={`px-4 py-3 rounded-2xl flex items-center gap-4 shadow-md shadow-black/30 hover:shadow-lg hover:shadow-black/40 transition-all duration-300 card-enter-animation`} style={{ backgroundColor: bgColor }}>
            <div className={`p-3 rounded-xl ${iconContainerClass}`}>
                {/* FIX: The type of icon props is inferred as `unknown`, which doesn't have `className`. By rendering the icon inside a div with the opacity class, we achieve the same visual effect without type errors. */}
                <div className="opacity-80">{icon}</div>
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-400 truncate">{title}</h3>
                <p className={`text-xl font-bold truncate ${valueColor}`}>{animatedValue}</p>
            </div>
        </div>
    );
};


// Chart Components (Redesigned)
const OrdersByClientChart = ({ orders, colors }: { orders: ServiceOrder[], colors: Record<string, string> }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
    const { kanbanColumns } = useAppContext();


    useEffect(() => {
        if (!chartRef.current) return;

        // 1. Group orders by client and count status for each
        const clientStatusCounts = orders.reduce<Record<string, Partial<Record<OrderStatus, number>>>>((acc, order) => {
            if (!acc[order.client]) {
                acc[order.client] = {};
            }
            acc[order.client][order.status] = (acc[order.client][order.status] || 0) + 1;
            return acc;
        }, {});

        // 2. Get top clients based on total OS count
        const clientTotalCounts = Object.entries(clientStatusCounts).map(([client, statuses]) => ({
            client,
            total: Object.values(statuses).reduce((sum, count) => (sum || 0) + (count || 0), 0)
        }));
        
        const sortedClients = clientTotalCounts.sort((a, b) => b.total - a.total).slice(0, 8);
        const labels = sortedClients.map(c => c.client);

        // 3. Define the statuses in a consistent order from the context
        const statusesInOrder = kanbanColumns.map(c => c.status).filter(s => s !== 'Entregue');
        
        // 4. Create datasets for chart.js
        const datasets = statusesInOrder.map(status => {
            const column = kanbanColumns.find(c => c.status === status);
            return {
                label: column?.title || status,
                data: labels.map(client => clientStatusCounts[client]?.[status] || 0),
                backgroundColor: colors[status] || '#808080',
                borderRadius: 4,
                borderWidth: 2,
                borderColor: '#1A1A1A'
            }
        });
        
        const chartData = {
            labels,
            datasets
        };

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: { 
                        stacked: true,
                        display: false, 
                        grid: { display: false }
                    },
                    y: { 
                        stacked: true,
                        ticks: { color: '#A0A0A0', font: { weight: '600', family: 'Poppins' } }, 
                        grid: { display: false, drawBorder: false } 
                    }
                },
                plugins: {
                    legend: { 
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#A0A0A0',
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 20,
                            font: { family: 'Poppins' }
                        }
                    },
                    title: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#232323',
                        titleFont: { family: 'Poppins', weight: 'bold' },
                        bodyFont: { family: 'Poppins' },
                        padding: 10,
                        callbacks: {
                            label: function(context: any) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null && context.parsed.x > 0) {
                                    label += context.parsed.x;
                                    return label;
                                }
                                return null;
                            }
                        }
                    },
                },
            }
        });
        return () => { if (chartInstance.current) chartInstance.current.destroy() };
    }, [orders, colors, kanbanColumns]);

    return <canvas ref={chartRef} />;
};


const OrdersByStatusChart = ({ orders }: { orders: ServiceOrder[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
    const { kanbanColumns } = useAppContext();

    useEffect(() => {
        if (!chartRef.current) return;
        const statusCounts = orders.filter(o => o.status !== 'Entregue').reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<OrderStatus, number>);
        
        // Use kanbanColumns to ensure order and get titles
        const chartLabelsAndData = kanbanColumns
            .filter(c => c.status !== 'Entregue' && statusCounts[c.status] > 0)
            .map(column => ({
                label: column.title,
                data: statusCounts[column.status],
                color: column.color
            }));

        const labels = chartLabelsAndData.map(d => d.label);
        const data = chartLabelsAndData.map(d => d.data);
        const backgroundColors = chartLabelsAndData.map(d => d.color);

        const chartData = {
             labels,
             datasets: [{
                label: 'Distribuição de OS',
                data,
                backgroundColor: backgroundColors,
                borderColor: '#1B1B1B',
                borderWidth: 4,
            }]
        }

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { 
                        position: 'bottom',
                        align: 'center',
                        labels: { 
                            color: '#A0A0A0',
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 16,
                             font: {
                                family: 'Poppins'
                            }
                        }
                    },
                    title: { display: false }
                }
            }
        });
         return () => { if (chartInstance.current) chartInstance.current.destroy() };
    }, [orders, kanbanColumns]);

    return <canvas ref={chartRef} />;
}

const EvolutionChart = ({ orders }: { orders: ServiceOrder[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const months = [];
        const createdData = [];
        const deliveredData = [];
        const activeData = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
            months.push(monthLabel);
            
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            createdData.push(
                orders.filter(o => {
                    const creationDate = new Date(o.creationDate);
                    return creationDate >= startOfMonth && creationDate <= endOfMonth;
                }).length
            );

            deliveredData.push(
                orders.filter(o => {
                    if (!o.deliveryDate) return false;
                    const deliveryDate = new Date(o.deliveryDate);
                    return deliveryDate >= startOfMonth && deliveryDate <= endOfMonth;
                }).length
            );
            
            activeData.push(
                orders.filter(o => {
                    const creationDate = new Date(o.creationDate);
                    const deliveryDate = o.deliveryDate ? new Date(o.deliveryDate) : null;
                    const wasCreatedBeforeOrDuringMonth = creationDate <= endOfMonth;
                    const notDeliveredOrDeliveredAfterStart = !deliveryDate || deliveryDate >= startOfMonth;
                    return wasCreatedBeforeOrDuringMonth && notDeliveredOrDeliveredAfterStart;
                }).length
            );
        }

        const chartData = {
            labels: months,
            datasets: [
                {
                    label: 'OS Ativas',
                    data: activeData,
                    borderColor: '#DCFF00', 
                    backgroundColor: '#DCFF00',
                    fill: false,
                    tension: 0,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
                {
                    label: 'OS Entregues',
                    data: deliveredData,
                    borderColor: 'rgba(220, 255, 0, 0.7)',
                    backgroundColor: 'rgba(220, 255, 0, 0.7)',
                    fill: false,
                    tension: 0,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
                {
                    label: 'OS Criadas',
                    data: createdData,
                    borderColor: 'rgba(220, 255, 0, 0.4)',
                    backgroundColor: 'rgba(220, 255, 0, 0.4)',
                    fill: false,
                    tension: 0,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }
            ]
        };

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#A0A0A0', font: { family: 'Poppins' }, precision: 0 },
                        grid: { color: 'rgba(160, 160, 160, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#A0A0A0', font: { family: 'Poppins' } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#A0A0A0', font: { family: 'Poppins' }, usePointStyle: true, boxWidth: 8, padding: 20 }
                    },
                    tooltip: {
                         backgroundColor: '#232323',
                        titleFont: { family: 'Poppins', weight: 'bold' },
                        bodyFont: { family: 'Poppins' },
                        padding: 10,
                    }
                }
            }
        });
        
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };

    }, [orders]);

    return <canvas ref={chartRef} />;
};


interface DashboardPageProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectOrder }) => {
  const { orders, currentUser, logout, kanbanColumns } = useAppContext();
  const [period, setPeriod] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const isAdmin = currentUser?.role === UserRole.Admin;

  const userNames = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.responsible).filter((r): r is string => !!r)))], [orders]);
  
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
        let inPeriod = true;
        if (period !== 'all') {
            const creationDate = new Date(order.creationDate);
            if (period === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                inPeriod = creationDate > oneWeekAgo;
            } else if (period === 'month') {
                const oneMonthAgo = new Date(now.getTime());
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                inPeriod = creationDate > oneMonthAgo;
            }
        }
        const userMatch = selectedUser === 'all' || order.responsible === selectedUser;
        return inPeriod && userMatch;
    });
  }, [orders, period, selectedUser]);


  const kpiData = useMemo(() => {
    const now = new Date();
    const openValue = filteredOrders.filter(o => o.status !== 'Entregue').reduce((sum, o) => sum + (o.value || 0), 0);
    const deliveredValue = filteredOrders.filter(o => o.status === 'Entregue').reduce((sum, o) => sum + (o.value || 0), 0);
    const inProgress = filteredOrders.filter(o => o.status !== 'Aguardando produto' && o.status !== 'Entregue').length;
    const overdue = filteredOrders.filter(o => o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) < now && o.status !== 'Entregue').length;
    return { inProgress, overdue, totalValue: openValue, deliveredValue, faturamPreferido: 34300 };
  }, [filteredOrders]);
  
  const chartColors = useMemo(() => {
    return kanbanColumns.reduce((acc, col) => {
      acc[col.status] = col.color;
      return acc;
    }, {} as Record<string, string>);
  }, [kanbanColumns]);

  const handleGenerateInsight = async () => {
    setIsInsightLoading(true);
    setIsInsightModalOpen(true);
    const insight = await generateFinancialInsight({
        totalValue: kpiData.totalValue, deliveredValue: kpiData.deliveredValue, openValue: kpiData.totalValue - kpiData.deliveredValue, overdueCount: kpiData.overdue
    });
    setInsightText(insight);
    setIsInsightLoading(false);
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto w-full bg-[#1C1C1C] p-4 md:p-6 rounded-lg h-full flex flex-col gap-6">
      {/* KPIs */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {isAdmin && (
            <>
                <StatCard title="Valor em Aberto" value={kpiData.totalValue} valueColor="text-gray-200" icon={<PiggyBank size={22} />} bgColor="#2E2E2E" iconContainerClass="bg-blue-500/20 text-blue-300" isCurrency />
                <StatCard title="Faturamento Realizado" value={kpiData.deliveredValue} valueColor="text-green-400" icon={<DollarSign size={22} />} bgColor="#2E332B" iconContainerClass="bg-green-500/20 text-green-300" isCurrency />
                <StatCard title="Faturamento Previsto" value={kpiData.faturamPreferido} valueColor="text-orange-300" icon={<BarChart3 size={22} />} bgColor="#332E2E" iconContainerClass="bg-orange-500/20 text-orange-300" isCurrency />
            </>
        )}
        <StatCard title="OS em Andamento" value={kpiData.inProgress} valueColor="text-gray-300" icon={<Clock size={22} />} bgColor="#2C2C2C" iconContainerClass="bg-gray-500/20 text-gray-300" />
        <StatCard title="OS Atrasadas" value={kpiData.overdue} valueColor="text-red-400" icon={<AlertTriangle size={22} />} bgColor="#3A2828" iconContainerClass="bg-red-500/20 text-red-300" />
      </div>

      {isAdmin && (
        <div className="flex-shrink-0 text-center">
            <button 
                onClick={handleGenerateInsight}
                disabled={isInsightLoading}
                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500/80 to-blue-500/80 rounded-lg text-sm font-bold text-white hover:from-purple-500 hover:to-blue-500 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-wait shadow-lg hover:shadow-purple-500/20"
            >
                {isInsightLoading ? (
                    <>
                        <Loader size={18} className="animate-spin mr-3" />
                        <span>Analisando...</span>
                    </>
                ) : (
                    <>
                        <Bot size={18} className="mr-3" />
                        <span>Gerar Análise Financeira com IA</span>
                    </>
                )}
            </button>
        </div>
      )}

      {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[350px]">
            <div className="lg:col-span-3 bg-[#1A1A1A] p-6 rounded-2xl flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4">Volume e Status de OS por Cliente</h2>
                <div className="flex-1"><OrdersByClientChart orders={filteredOrders} colors={chartColors} /></div>
            </div>
            <div className="lg:col-span-2 bg-[#1B1B1B] p-6 rounded-2xl flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4">Distribuição de OS por Status</h2>
                <div className="flex-1"><OrdersByStatusChart orders={filteredOrders} /></div>
            </div>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-2xl flex flex-col min-h-[350px]">
            <h2 className="text-lg font-semibold text-white mb-4">Evolução Mensal de OS</h2>
            <div className="flex-1 relative">
                <EvolutionChart orders={orders} />
            </div>
        </div>
      
      {/* Footer */}
      <div className="flex-shrink-0 flex justify-between items-center text-xs mt-auto pt-6">
        <p className="text-gray-500 flex items-center"><Clock size={14} className="mr-2 opacity-70"/> Última atualização, há 3 minutos</p>
        <button className="px-4 py-2 bg-gray-800/50 rounded-lg font-semibold text-gray-300 hover:bg-gray-700 transition-colors">
            Exportar
        </button>
      </div>
      
      {isInsightModalOpen && (
        <FinancialInsightModal
            isLoading={isInsightLoading}
            insightText={insightText}
            onClose={() => setIsInsightModalOpen(false)}
        />
      )}
    </div>
  );
};
