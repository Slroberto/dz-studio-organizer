import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ServiceOrder, User, OrderStatus } from '../types';
import { BarChart3, Package, CheckCircle, Clock, AlertTriangle, CalendarDays, BarChartHorizontal, FileDown } from 'lucide-react';
import { useAppContext } from './AppContext';

// This lets TypeScript know that `Chart` will be available on the global scope
// from the script tag loaded in index.html.
declare const Chart: any;
declare const jspdf: any;

// Custom Hook for count-up animation
const useCountUp = (end: number, duration = 1500) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    
    useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = (frame / totalFrames);
            const currentCount = Math.round(end * progress);
            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
                 setCount(end); // Ensure final value is exact
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, duration, totalFrames]);

    return count;
};


// Stat Card Component
const StatCard = ({ title, value, icon, colorClass, details }: { title: string, value: number, icon: React.ReactNode, colorClass?: string, details?: string }) => {
    const animatedValue = useCountUp(value);
    return (
        <div className="bg-black/20 p-4 rounded-lg flex items-center border border-granite-gray/20 animate-fade-in">
            <div className={`p-3 rounded-full mr-4 ${colorClass || 'bg-granite-gray/20 text-granite-gray-light'}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-granite-gray-light">{title}</h3>
                <p className="text-2xl font-bold text-white">{animatedValue}</p>
                 {details && <p className="text-xs text-gray-500">{details}</p>}
            </div>
        </div>
    );
};


// Chart Components
const OrdersByClientChart = ({ orders }: { orders: ServiceOrder[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const clientCounts = orders.reduce((acc, order) => {
            acc[order.client] = (acc[order.client] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sortedClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = sortedClients.map(c => c[0]);
        const data = sortedClients.map(c => c[1]);

        const chartData = {
            labels,
            datasets: [{
                label: 'OS por Cliente',
                data,
                backgroundColor: 'rgba(220, 255, 0, 0.6)',
                borderColor: 'rgba(220, 255, 0, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }]
        };

        if (chartInstance.current) {
            chartInstance.current.data = chartData;
            chartInstance.current.update();
        } else {
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { beginAtZero: true, ticks: { color: '#8A8A7D' }, grid: { color: 'rgba(138, 138, 125, 0.1)' } },
                        y: { ticks: { color: '#E5E5E5' }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Top Clientes por Volume de OS', color: '#E5E5E5', font: { size: 16 } }
                    }
                }
            });
        }
    }, [orders]);

    return <canvas ref={chartRef} />;
};


const OrdersByStatusChart = ({ orders }: { orders: ServiceOrder[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<OrderStatus, number>);
        
        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);

        const chartData = {
             labels,
             datasets: [{
                label: 'Distribuição de OS',
                data,
                backgroundColor: [
                    '#5AC8FA', // Waiting
                    '#FF9500', // Shooting
                    '#FFCC00', // Development
                    '#DCFF00', // Post
                    '#AF52DE', // Cromia
                    '#FF3B30', // Approval
                    '#4CD964', // Delivered
                ],
                borderColor: '#232323',
                borderWidth: 2,
            }]
        }

        if (chartInstance.current) {
            chartInstance.current.data = chartData;
            chartInstance.current.update();
        } else {
             const ctx = chartRef.current.getContext('2d');
             chartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { color: '#E5E5E5' } },
                        title: { display: true, text: 'Distribuição de OS por Status', color: '#E5E5E5', font: { size: 16 } }
                    }
                }
            });
        }
         return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };

    }, [orders]);

    return <canvas ref={chartRef} />;
}

interface DashboardPageProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectOrder }) => {
  const { orders } = useAppContext();
  const [period, setPeriod] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  const clientNames = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.client)))], [orders]);
  // FIX: Dynamically generate user list from order data since MOCK_USERS is no longer available.
  const userNames = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.responsible).filter((r): r is string => !!r)))], [orders]);
  
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
        let inPeriod = true;
        if (period !== 'all') {
            const creationDate = new Date(order.creationDate);
            if (period === 'week') {
                const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
                inPeriod = creationDate > oneWeekAgo;
            } else if (period === 'month') {
                const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
                inPeriod = creationDate > oneMonthAgo;
            }
        }
        const userMatch = selectedUser === 'all' || order.responsible === selectedUser;
        return inPeriod && userMatch;
    });
  }, [orders, period, selectedUser]);


  const kpiData = useMemo(() => {
    const now = new Date();
    const inProgress = filteredOrders.filter(o => o.status !== OrderStatus.Waiting && o.status !== OrderStatus.Delivered).length;
    const waiting = filteredOrders.filter(o => o.status === OrderStatus.Waiting).length;
    const delivered = filteredOrders.filter(o => o.status === OrderStatus.Delivered).length;
    const overdue = filteredOrders.filter(o => o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) < now && o.status !== OrderStatus.Delivered).length;

    const completedOrdersWithDates = filteredOrders.filter(o => o.status === OrderStatus.Delivered && o.creationDate && o.deliveryDate);
    const avgTimeInMillis = completedOrdersWithDates.reduce((acc, o) => {
        const start = new Date(o.creationDate).getTime();
        const end = new Date(o.deliveryDate!).getTime();
        return acc + (end - start);
    }, 0) / (completedOrdersWithDates.length || 1);
    const avgDays = Math.round(avgTimeInMillis / (1000 * 60 * 60 * 24));


    return { inProgress, waiting, delivered, overdue, avgDays };
  }, [filteredOrders]);

  const highlightedOrders = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const overdue = filteredOrders
        .filter(o => o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) < now && o.status !== OrderStatus.Delivered)
        .map(o => ({ ...o, highlight: 'red' }));

    const dueSoon = filteredOrders
        .filter(o => o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) >= now && new Date(o.expectedDeliveryDate) <= sevenDaysFromNow && o.status !== OrderStatus.Delivered)
        .map(o => ({ ...o, highlight: 'yellow' }));
    
    return [...overdue, ...dueSoon].sort((a,b) => new Date(a.expectedDeliveryDate!).getTime() - new Date(b.expectedDeliveryDate!).getTime());
  }, [filteredOrders]);
  
  const getDaysRemaining = (dateStr?: string) => {
      if (!dateStr) return { text: '-', color: '' };
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const dueDate = new Date(dateStr);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { text: `${Math.abs(diffDays)} dias atrasado`, color: 'text-red-400 font-bold' };
      if (diffDays === 0) return { text: 'Hoje', color: 'text-yellow-400 font-bold' };
      if (diffDays <= 7) return { text: `${diffDays} dias`, color: 'text-yellow-400' };
      return { text: `${diffDays} dias`, color: '' };
  };

  const exportPDF = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Relatório de Desempenho - DZ Studio', 10, 20);

    const kpiText = `Em Andamento: ${kpiData.inProgress} | Aguardando: ${kpiData.waiting} | Entregues: ${kpiData.delivered} | Atrasadas: ${kpiData.overdue}`;
    doc.setFontSize(10);
    doc.text(kpiText, 10, 30);

    const clientChartCanvas = (document.querySelector('#clientChart canvas') as HTMLCanvasElement);
    const statusChartCanvas = (document.querySelector('#statusChart canvas') as HTMLCanvasElement);
    
    if (clientChartCanvas) {
        doc.addImage(clientChartCanvas.toDataURL('image/png'), 'PNG', 10, 40, 180, 100);
    }
    if (statusChartCanvas) {
        doc.addPage();
        doc.addImage(statusChartCanvas.toDataURL('image/png'), 'PNG', 10, 20, 180, 90);
    }

    if (highlightedOrders.length > 0) {
        (doc as any).autoTable({
            startY: 120,
            head: [['Cliente', 'OS', 'Status', 'Prazo', 'Dias Restantes']],
            body: highlightedOrders.map(o => [
                o.client,
                o.orderNumber,
                o.status,
                o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('pt-BR') : '-',
                getDaysRemaining(o.expectedDeliveryDate).text
            ])
        });
    }

    doc.save(`DZ_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Filters and Header */}
      <div className="flex-shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <select onChange={(e) => setPeriod(e.target.value)} value={period} className="bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow">
                <option value="all">Todo o Período</option>
                <option value="month">Último Mês</option>
                <option value="week">Última Semana</option>
            </select>
            <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser} className="bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow">
                {userNames.map(name => <option key={name} value={name}>{name === 'all' ? 'Todos os Usuários' : name}</option>)}
            </select>
        </div>
         <button onClick={exportPDF} className="flex items-center px-4 py-2 bg-granite-gray/20 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/40 transition-colors">
            <FileDown size={16} className="mr-2" />
            Gerar Relatório
        </button>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Em Andamento" value={kpiData.inProgress} icon={<Clock size={24} />} colorClass="bg-blue-500/20 text-blue-400" />
        <StatCard title="Aguardando Produto" value={kpiData.waiting} icon={<Package size={24} />} colorClass="bg-purple-500/20 text-purple-400"/>
        <StatCard title="Entregues" value={kpiData.delivered} icon={<CheckCircle size={24} />} colorClass="bg-green-500/20 text-green-400" />
        <StatCard title="Atrasadas" value={kpiData.overdue} icon={<AlertTriangle size={24} />} colorClass="bg-red-500/20 text-red-400"/>
        <StatCard title="Tempo Médio" value={kpiData.avgDays} details="dias / OS" icon={<CalendarDays size={24} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-[300px]">
        <div id="clientChart" className="lg:col-span-3 bg-black/20 p-4 rounded-lg border border-granite-gray/20"><OrdersByClientChart orders={filteredOrders} /></div>
        <div id="statusChart" className="lg:col-span-2 bg-black/20 p-4 rounded-lg border border-granite-gray/20"><OrdersByStatusChart orders={filteredOrders} /></div>
      </div>

      {/* Highlighted Orders Table */}
      <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20">
         <h3 className="text-lg font-bold mb-4 font-display">Ordens de Serviço em Destaque</h3>
         <div className="overflow-y-auto max-h-64">
             <table className="w-full text-left text-sm">
                 <thead className="sticky top-0 bg-coal-black">
                     <tr>
                         <th className="p-3">Cliente</th>
                         <th className="p-3">OS</th>
                         <th className="p-3">Status</th>
                         <th className="p-3">Prazo</th>
                         <th className="p-3">Dias Restantes</th>
                         <th className="p-3">Responsável</th>
                         <th className="p-3">Ação</th>
                     </tr>
                 </thead>
                 <tbody>
                    {highlightedOrders.map(order => {
                         const daysInfo = getDaysRemaining(order.expectedDeliveryDate);
                         return (
                            <tr key={order.id} className="border-t border-granite-gray/20 hover:bg-granite-gray/10">
                                <td className="p-3 font-semibold">{order.client}</td>
                                <td className="p-3 text-granite-gray-light">{order.orderNumber}</td>
                                <td className="p-3">{order.status}</td>
                                <td className="p-3">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('pt-BR') : '-'}</td>
                                <td className={`p-3 ${daysInfo.color}`}>{daysInfo.text}</td>
                                <td className="p-3">{order.responsible}</td>
                                <td className="p-3">
                                    <button onClick={() => onSelectOrder(order)} className="px-3 py-1 bg-cadmium-yellow text-coal-black font-bold rounded text-xs hover:brightness-110">
                                        Ver OS
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    {highlightedOrders.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center p-8 text-granite-gray">
                                Nenhuma OS com prazo próximo ou em atraso.
                            </td>
                        </tr>
                    )}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};