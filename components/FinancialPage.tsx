import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from './AppContext';
import { FixedCost, VariableCost, RevenueEntry, FinancialCategory, NotificationColorType, ServiceOrder } from '../types';
import { DollarSign, Landmark, TrendingUp, Target, PiggyBank, BarChart, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { FinancialEntryModal } from './FinancialEntryModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ProfitabilityDashboard } from './ProfitabilityDashboard';

declare const Chart: any;

const KpiCard = ({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color?: string }) => (
    <div className="bg-black/20 p-4 rounded-lg flex items-center border border-granite-gray/20 card-enter-animation">
        <div className={`p-3 rounded-lg mr-4 ${color || 'bg-granite-gray/20 text-cadmium-yellow'}`}>{icon}</div>
        <div>
            <h3 className="text-sm font-semibold text-granite-gray-light">{title}</h3>
            <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const RevenueEvolutionChart = ({ revenueEntries }: { revenueEntries: RevenueEntry[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const monthlyData: { [key: string]: number } = {};
        const now = new Date();
        const labels: string[] = [];

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().substring(0, 7); // "YYYY-MM"
            labels.push(date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
            monthlyData[monthKey] = 0;
        }

        // Aggregate revenue data
        revenueEntries.forEach(entry => {
            const monthKey = entry.date.substring(0, 7);
            if (monthlyData.hasOwnProperty(monthKey)) {
                monthlyData[monthKey] += entry.value;
            }
        });

        const data = Object.keys(monthlyData).sort().map(key => monthlyData[key]);

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Receita Mensal',
                    data,
                    borderColor: '#DCFF00',
                    backgroundColor: 'rgba(220, 255, 0, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#DCFF00',
                    pointRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#8A8A7D',
                            callback: function(value: any) {
                                if (value >= 1000) {
                                    return 'R$ ' + (value / 1000) + 'k';
                                }
                                return 'R$ ' + value;
                            }
                        },
                        grid: { color: 'rgba(138, 138, 125, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#E5E5E5' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1A1A1A',
                        titleFont: { family: 'Poppins', weight: 'bold' },
                        bodyFont: { family: 'Poppins' },
                        padding: 10,
                        callbacks: {
                            label: function(context: any) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [revenueEntries]);

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 h-full flex flex-col">
            <h3 className="text-lg font-bold text-center mb-2">Evolução da Receita (Últimos 12 meses)</h3>
            <div className="flex-1 relative"><canvas ref={chartRef}></canvas></div>
        </div>
    );
};


const BreakEvenChart = ({ revenue, breakEven, currency }: { revenue: number, breakEven: number, currency: string }) => {
    const percentage = breakEven > 0 ? Math.min((revenue / breakEven) * 100, 100) : 0;
    const isOver = revenue > breakEven;

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 h-full flex flex-col justify-center">
            <h3 className="text-lg font-bold text-center mb-2">Ponto de Equilíbrio (Mês)</h3>
            <div className="w-full bg-granite-gray/20 rounded-full h-4 relative">
                <div className="bg-cadmium-yellow h-4 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                {isOver && <div className="absolute top-0 h-4 rounded-full bg-green-500" style={{ left: `${(breakEven / revenue) * 100}%`, width: `${((revenue - breakEven) / revenue) * 100}%`}}></div>}
            </div>
            <div className="flex justify-between text-xs mt-2 font-semibold">
                <span>0 {currency}</span>
                <span className="font-bold text-cadmium-yellow">{breakEven.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <p className="text-center text-sm mt-2">
                {isOver 
                    ? <span className="text-green-400 font-semibold">Meta atingida! Lucro de {(revenue - breakEven).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    : <span className="text-yellow-400">Faltam {(breakEven - revenue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para o ponto de equilíbrio.</span>
                }
            </p>
        </div>
    );
};

const CostDistributionChart = ({ fixed, variable }: { fixed: number, variable: number }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Custos Fixos', 'Custos Variáveis'],
                datasets: [{
                    data: [fixed, variable],
                    backgroundColor: ['#DCFF00', '#69695A'],
                    borderColor: '#232323',
                    borderWidth: 4,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        labels: { 
                            color: '#E5E5E5',
                            font: { family: 'Poppins' }
                        } 
                    },
                    tooltip: {
                        backgroundColor: '#1A1A1A',
                        titleFont: { family: 'Poppins', weight: 'bold' },
                        bodyFont: { family: 'Poppins' },
                        padding: 10,
                        callbacks: {
                            label: function(context: any) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                                    const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                    const value = context.parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    label += `${value} (${percentage}%)`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [fixed, variable]);

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 h-full flex flex-col">
            <h3 className="text-lg font-bold text-center mb-2">Distribuição de Custos</h3>
            <div className="flex-1 relative"><canvas ref={chartRef}></canvas></div>
        </div>
    );
};

const CostByCategoryChart = ({ fixedCosts, variableCosts }: { fixedCosts: FixedCost[], variableCosts: VariableCost[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const costsByCategory: { [key in FinancialCategory]?: number } = {};
        
        fixedCosts.forEach(cost => {
            costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + cost.value;
        });

        variableCosts.forEach(cost => {
            costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + cost.value;
        });
        
        const labels = Object.keys(costsByCategory);
        const data = Object.values(costsByCategory);
        
        const backgroundColors = ['#DCFF00', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#ef4444', '#16a34a', '#69695A'];

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        chartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: '#232323',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#E5E5E5', font: { family: 'Poppins' } } },
                    title: { display: true, text: 'Custos por Categoria (Mês)', color: '#E5E5E5', font: { size: 16, family: 'Poppins' } }
                }
            }
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };

    }, [fixedCosts, variableCosts]);

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 h-full flex flex-col">
            <div className="flex-1 relative"><canvas ref={chartRef}></canvas></div>
        </div>
    );
};

const DataTable = ({ title, data, onAdd, onEdit, onDelete }: { title: string, data: any[], onAdd: () => void, onEdit: (item: any) => void, onDelete: (item: any) => void }) => (
    <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onAdd} className="flex items-center gap-2 px-3 py-1.5 bg-cadmium-yellow/80 rounded-lg text-xs font-bold text-coal-black hover:bg-cadmium-yellow transition-transform transform active:scale-95"><PlusCircle size={16}/> Adicionar</button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {data.length > 0 ? data.map(item => (
                 <div key={item.id} className="flex items-center justify-between p-2.5 bg-granite-gray/10 rounded-md hover:bg-granite-gray/20">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-gray-200">{item.name || item.description}</p>
                        <p className="text-xs text-granite-gray-light">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                        <span className="font-mono text-gray-200 text-sm">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <div className="flex items-center">
                            <button onClick={() => onEdit(item)} className="p-1 text-granite-gray-light hover:text-cadmium-yellow"><Edit size={16}/></button>
                            <button onClick={() => onDelete(item)} className="p-1 text-granite-gray-light hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center text-granite-gray py-8">Nenhum item adicionado.</div>
            )}
        </div>
    </div>
);

const FinancialOverview: React.FC = () => {
    const { 
        fixedCosts, variableCosts, revenueEntries,
        addFixedCost, updateFixedCost, deleteFixedCost,
        addVariableCost, updateVariableCost, deleteVariableCost,
        addRevenueEntry, updateRevenueEntry, deleteRevenueEntry,
        addNotification
    } = useAppContext();

    const [activeTab, setActiveTab] = useState<'fixed' | 'variable' | 'revenue'>('fixed');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<any | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<any | null>(null);
    const [modalType, setModalType] = useState<'fixed' | 'variable' | 'revenue'>('fixed');

    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));

    const financialData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);

        const monthlyFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.value, 0);

        const filteredVariableCosts = variableCosts.filter(cost => {
            const costDate = new Date(cost.date);
            return costDate.getFullYear() === year && costDate.getMonth() === month - 1;
        });
        const monthlyVariableCosts = filteredVariableCosts.reduce((sum, cost) => sum + cost.value, 0);

        const filteredRevenues = revenueEntries.filter(rev => {
            const revDate = new Date(rev.date);
            return revDate.getFullYear() === year && revDate.getMonth() === month - 1;
        });
        const monthlyRevenue = filteredRevenues.reduce((sum, rev) => sum + rev.value, 0);

        const contributionMargin = monthlyRevenue - monthlyVariableCosts;
        const contributionMarginRatio = monthlyRevenue > 0 ? contributionMargin / monthlyRevenue : 0;
        const breakEvenPoint = contributionMarginRatio > 0 ? monthlyFixedCosts / contributionMarginRatio : Infinity;
        const profit = monthlyRevenue - monthlyFixedCosts - monthlyVariableCosts;

        return {
            monthlyRevenue, monthlyFixedCosts, monthlyVariableCosts,
            profit, breakEvenPoint,
            filteredVariableCosts: filteredVariableCosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            filteredRevenues: filteredRevenues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
    }, [selectedMonth, fixedCosts, variableCosts, revenueEntries]);

    const handleOpenModal = (type: 'fixed' | 'variable' | 'revenue', entry: any | null = null) => {
        setModalType(type);
        setEntryToEdit(entry);
        setIsModalOpen(true);
    };
    
    const handleSaveEntry = async (entry: any) => {
        const isEditing = !!entryToEdit;
        if (modalType === 'fixed') {
            isEditing ? await updateFixedCost(entry) : await addFixedCost(entry);
        } else if (modalType === 'variable') {
            isEditing ? await updateVariableCost(entry) : await addVariableCost(entry);
        } else {
            isEditing ? await updateRevenueEntry(entry) : await addRevenueEntry(entry);
        }
        addNotification({ message: `Item ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`, type: NotificationColorType.Success });
        setIsModalOpen(false);
        setEntryToEdit(null);
    };

    const handleDelete = (type: 'fixed' | 'variable' | 'revenue', entry: any) => {
        setModalType(type);
        setEntryToDelete(entry);
    };

    const confirmDelete = async () => {
        if(!entryToDelete) return;
        const description = entryToDelete.name || entryToDelete.description;
        if (modalType === 'fixed') await deleteFixedCost(entryToDelete.id);
        else if (modalType === 'variable') await deleteVariableCost(entryToDelete.id);
        else await deleteRevenueEntry(entryToDelete.id);
        addNotification({ message: `Item "${description}" excluído.`, type: NotificationColorType.Warning });
        setEntryToDelete(null);
    };

    const TabButton = ({ type, label }: { type: 'fixed' | 'variable' | 'revenue', label: string }) => (
        <button
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === type ? 'border-b-4 border-cadmium-yellow text-cadmium-yellow' : 'text-granite-gray-light hover:text-white'}`}
        >{label}</button>
    );

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-shrink-0 flex justify-between items-center">
                <h1 className="text-xl font-semibold flex items-center gap-3">Visão Geral do Mês</h1>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Receita Total (Mês)" value={financialData.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={22}/>} color="bg-green-500/20 text-green-300" />
                <KpiCard title="Custos Totais (Mês)" value={(financialData.monthlyFixedCosts + financialData.monthlyVariableCosts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<PiggyBank size={22}/>} color="bg-red-500/20 text-red-300" />
                <KpiCard title="Lucro/Prejuízo (Mês)" value={financialData.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<TrendingUp size={22}/>} color={financialData.profit >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"} />
                <KpiCard title="Ponto de Equilíbrio" value={financialData.breakEvenPoint === Infinity ? 'N/A' : financialData.breakEvenPoint.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<Target size={22}/>} />
            </div>

            <div className="h-72">
                <RevenueEvolutionChart revenueEntries={revenueEntries} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-72">
                <div className="lg:col-span-1"><BreakEvenChart revenue={financialData.monthlyRevenue} breakEven={financialData.breakEvenPoint} currency="BRL" /></div>
                <div className="lg:col-span-1"><CostDistributionChart fixed={financialData.monthlyFixedCosts} variable={financialData.monthlyVariableCosts} /></div>
                <div className="lg:col-span-1"><CostByCategoryChart fixedCosts={fixedCosts} variableCosts={financialData.filteredVariableCosts} /></div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 mt-4">
                <div className="flex-shrink-0 border-b border-granite-gray/20">
                    <TabButton type="fixed" label="Custos Fixos" />
                    <TabButton type="variable" label="Custos Variáveis" />
                    <TabButton type="revenue" label="Receitas" />
                </div>
                <div className="py-4 flex-1 min-h-0">
                    {activeTab === 'fixed' && <DataTable title="Custos Fixos Mensais" data={fixedCosts} onAdd={() => handleOpenModal('fixed')} onEdit={(item) => handleOpenModal('fixed', item)} onDelete={(item) => handleDelete('fixed', item)} />}
                    {activeTab === 'variable' && <DataTable title={`Custos Variáveis de ${new Date(selectedMonth+'-02').toLocaleDateString('pt-BR', {month: 'long'})}`} data={financialData.filteredVariableCosts} onAdd={() => handleOpenModal('variable')} onEdit={(item) => handleOpenModal('variable', item)} onDelete={(item) => handleDelete('variable', item)} />}
                    {activeTab === 'revenue' && <DataTable title={`Receitas de ${new Date(selectedMonth+'-02').toLocaleDateString('pt-BR', {month: 'long'})}`} data={financialData.filteredRevenues} onAdd={() => handleOpenModal('revenue')} onEdit={(item) => handleOpenModal('revenue', item)} onDelete={(item) => handleDelete('revenue', item)} />}
                </div>
            </div>

             {isModalOpen && (
                <FinancialEntryModal
                    type={modalType}
                    entry={entryToEdit}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveEntry}
                />
            )}
            {entryToDelete && (
                <ConfirmDeleteModal
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o item "<strong>${entryToDelete.name || entryToDelete.description}</strong>"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setEntryToDelete(null)}
                />
            )}
        </div>
    );
};


interface FinancialPageProps {
    onSelectOrder: (order: ServiceOrder) => void;
}

type FinancialTab = 'overview' | 'profitability';

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors ${
            isActive
                ? 'border-b-2 border-cadmium-yellow text-cadmium-yellow'
                : 'text-granite-gray-light border-transparent hover:text-white'
        }`}
    >
        {label}
    </button>
);

export const FinancialPage: React.FC<FinancialPageProps> = ({ onSelectOrder }) => {
    const [activeTab, setActiveTab] = useState<FinancialTab>('overview');

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-granite-gray/20 mb-4">
                <TabButton label="Visão Geral" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton label="Rentabilidade por OS" isActive={activeTab === 'profitability'} onClick={() => setActiveTab('profitability')} />
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && <FinancialOverview />}
                {activeTab === 'profitability' && <ProfitabilityDashboard onSelectOrder={onSelectOrder} />}
            </div>
        </div>
    );
};