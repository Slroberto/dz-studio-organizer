
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ServiceOrder, User, OrderStatus, UserRole } from '../types';
import { BarChart3, Package, CheckCircle, Clock, AlertTriangle, CalendarDays, BarChartHorizontal, FileDown, Bot, Loader, DollarSign, PiggyBank, Receipt, Lightbulb, ChevronDown, LogOut } from 'lucide-react';
import { useAppContext } from './AppContext';
import { FinancialInsightModal } from './FinancialInsightModal';
import { generateFinancialInsight } from '../services/geminiService';
import { StatCard } from './StatCard'; // Import the centralized component

// This lets TypeScript know that `Chart` will be available on the global scope
declare const Chart: any;

// Chart Components (Redesigned)
const OrdersByClientChart = ({ orders }: { orders: ServiceOrder[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const clientCounts = orders.reduce((acc, order) => {
            acc[order.client] = (acc[order.client] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sortedClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const labels = sortedClients.map(c => c[0]);
        const data = sortedClients.map(c => c[1]);

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, chartRef.current.width, 0);
        gradient.addColorStop(0, '#A5B800');
        gradient.addColorStop(1, '#DCFF00');

        const chartData = {
            labels,
            datasets: [{
                label: 'OS por Cliente',
                data,
                backgroundColor: gradient,
                borderColor: '#DCFF00',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 12,
            }]
        };

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: { display: false, beginAtZero: true },
                    y: { 
                        ticks: { color: '#A0A0A0', font: { weight: '500' } }, 
                        grid: { display: false, drawBorder: false } 
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: { enabled: false },
                },
                animation: {
                    onComplete: (animation: any) => {
                        const chart = animation.chart;
                        const ctx = chart.ctx;
                        ctx.font = 'bold 12px Poppins';
                        ctx.fillStyle = '#FFFFFF';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        
                        chart.data.datasets.forEach((dataset: any, i: number) => {
                            const meta = chart.getDatasetMeta(i);
                            meta.data.forEach((bar: any, index: number) => {
                                const data = dataset.data[index];
                                if (data > 0) {
                                    ctx.fillText(data, bar.x + 8, bar.y);
                                }
                            });
                        });
                    }
                }
            }
        });
        return () => { if (chartInstance.current) chartInstance.current.destroy() };
    }, [orders]);

    return <canvas ref={chartRef} />;
};


const OrdersByStatusChart = ({ orders }: { orders: ServiceOrder[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    const statusColors: Record<OrderStatus, string> = {
        [OrderStatus.Waiting]: '#5AC8FA',
        [OrderStatus.Shooting]: '#FF9500',
        [OrderStatus.Development]: '#FFCC00',
        [OrderStatus.PostProduction]: '#DCFF00',
        [OrderStatus.ColorGrading]: '#AF52DE',
        [OrderStatus.Approval]: '#FF3B30',
        [OrderStatus.Delivered]: '#4CD964',
    };

    useEffect(() => {
        if (!chartRef.current) return;
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<OrderStatus, number>);
        
        const labels = Object.keys(statusCounts) as OrderStatus[];
        const data = Object.values(statusCounts);

        const chartData = {
             labels,
             datasets: [{
                label: 'Distribuição de OS',
                data,
                backgroundColor: labels.map(label => statusColors[label] || '#8B8B8B'),
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
    }, [orders]);

    return <canvas ref={chartRef} />;
}

interface DashboardPageProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectOrder }) => {
  const { orders, currentUser, logout } = useAppContext();
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
    const openValue = filteredOrders.reduce((sum, o) => sum + (o.value || 0), 0);
    const deliveredValue = filteredOrders.filter(o => o.status === OrderStatus.Delivered).reduce((sum, o) => sum + (o.value || 0), 0);
    const inProgress = filteredOrders.filter(o => o.status !== OrderStatus.Waiting && o.status !== OrderStatus.Delivered).length;
    const overdue = filteredOrders.filter(o => o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) < now && o.status !== OrderStatus.Delivered).length;
    return { inProgress, overdue, totalValue: openValue, deliveredValue, faturamPreferido: 34300 };
  }, [filteredOrders]);

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
    <div className="bg-[#1C1C1C] p-4 md:p-6 rounded-lg h-full flex flex-col gap-6">
      {/* KPIs */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4`}>
        {isAdmin && (
            <>
                <StatCard title="Valor em Aberto" value={kpiData.totalValue} valueColor="text-gray-200" icon={<PiggyBank size={22} className="opacity-80"/>} bgColor="#2E2E2E" iconContainerClass="bg-blue-500/20 text-blue-300" isCurrency />
                <StatCard title="Faturamento Realizado" value={kpiData.deliveredValue} valueColor="text-green-400" icon={<DollarSign size={22} className="opacity-80"/>} bgColor="#2E332B" iconContainerClass="bg-green-500/20 text-green-300" isCurrency />
                <StatCard title="Faturamento Previsto" value={kpiData.faturamPreferido} valueColor="text-orange-300" icon={<BarChart3 size={22} className="opacity-80"/>} bgColor="#332E2E" iconContainerClass="bg-orange-500/20 text-orange-300" isCurrency />
            </>
        )}
        <StatCard title="OS em Andamento" value={kpiData.inProgress} valueColor="text-gray-300" icon={<Clock size={22} className="opacity-80"/>} bgColor="#2C2C2C" iconContainerClass="bg-gray-500/20 text-gray-300" />
        <StatCard title="OS Atrasadas" value={kpiData.overdue} valueColor="text-red-400" icon={<AlertTriangle size={22} className="opacity-80"/>} bgColor="#3A2828" iconContainerClass="bg-red-500/20 text-red-300" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-[350px]">
        <div className="lg:col-span-3 bg-[#1A1A1A] p-6 rounded-2xl flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Top Clientes por Volume de OS</h2>
            <div className="flex-1"><OrdersByClientChart orders={filteredOrders} /></div>
        </div>
        <div className="lg:col-span-2 bg-[#1B1B1B] p-6 rounded-2xl flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Distribuição de OS por Status</h2>
            <div className="flex-1"><OrdersByStatusChart orders={filteredOrders} /></div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex-shrink-0 flex justify-between items-center text-xs">
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
