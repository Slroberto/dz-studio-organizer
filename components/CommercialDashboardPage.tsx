import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CommercialQuote, QuoteStatus } from '../types';
import { QuoteManagementPage } from './QuoteManagementPage';
import { useAppContext } from './AppContext';
import { DollarSign, BarChart3, TrendingUp, FileText, Briefcase } from 'lucide-react';

interface CommercialDashboardPageProps {
    onConvertToOS: (quote: CommercialQuote) => void;
}

type CommercialTab = 'dashboard' | 'quotes';

declare const Chart: any;

function useCountUp(end: number, isCurrency = false, duration = 1500) {
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
                 setCount(end);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, duration, totalFrames]);
    
    if (isCurrency) {
        return count.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'});
    }
    return Math.round(count);
};

function KpiCard({ title, value, icon, isCurrency = false, isPercentage = false }: { title: string; value: number; icon: React.ReactNode; isCurrency?: boolean; isPercentage?: boolean; }) {
    const animatedValue = useCountUp(value, isCurrency);
    const animatedCount = useCountUp(value);

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 flex items-start justify-between card-enter-animation">
            <div>
                <h3 className="text-sm font-semibold text-granite-gray-light">{title}</h3>
                <p className="text-3xl font-bold text-white">
                    {isCurrency 
                        ? animatedValue 
                        : isPercentage 
                            ? `${value.toFixed(1)}%` 
                            : animatedCount
                    }
                </p>
            </div>
            <div className="p-2 rounded-lg bg-granite-gray/10 text-cadmium-yellow">{icon}</div>
        </div>
    );
};

function FunnelChart({ data }: { data: { sent: number; negotiating: number; approved: number } }) {
    const maxVal = data.sent > 0 ? data.sent : 1;
    return (
        <div className="space-y-3">
            {[
                { label: 'Enviados', value: data.sent, color: 'bg-blue-500' },
                { label: 'Em Negociação', value: data.negotiating, color: 'bg-purple-500' },
                { label: 'Aprovados', value: data.approved, color: 'bg-green-500' },
            ].map((stage, index) => (
                <div key={index} className="flex flex-col items-center">
                    <div className="w-full flex justify-between text-sm font-semibold mb-1">
                        <span className="text-gray-300">{stage.label}</span>
                        <span className="text-white">{stage.value}</span>
                    </div>
                    <div className="w-full bg-granite-gray/20 rounded-full h-6">
                        <div style={{ width: `${(stage.value / maxVal) * 100}%` }} className={`${stage.color} h-6 rounded-full transition-all duration-500`}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

function LossReasonChart({ quotes }: { quotes: CommercialQuote[] }) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current || !quotes) return;

        const rejectedQuotes = quotes.filter(q => q.status === 'Recusado' && q.lossReason);
        const reasonCounts = rejectedQuotes.reduce((acc: any, quote) => {
            acc[quote.lossReason!] = (acc[quote.lossReason!] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(reasonCounts);
        const data = Object.values(reasonCounts);

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderColor: '#232323',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#E5E5E5', usePointStyle: true, boxWidth: 8, padding: 16 } },
                }
            }
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [quotes]);

    return <canvas ref={chartRef}></canvas>;
};

function ClientRevenueChart({ quotes }: { quotes: CommercialQuote[] }) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current || !quotes) return;

        const clientData = quotes.reduce((acc: any, quote) => {
            if (!acc[quote.client]) acc[quote.client] = { approved: 0, rejected: 0 };
            if (quote.status === 'Aprovado') acc[quote.client].approved += quote.value;
            if (quote.status === 'Recusado') acc[quote.client].rejected += quote.value;
            return acc;
        }, {});
        
        const sortedClients = Object.entries(clientData).sort((a: any,b: any) => (b[1].approved + b[1].rejected) - (a[1].approved + a[1].rejected)).slice(0, 8);

        const labels = sortedClients.map(c => c[0]);
        const approvedData = sortedClients.map((c: any) => c[1].approved);
        const rejectedData = sortedClients.map((c: any) => c[1].rejected);

        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Valor Aprovado', data: approvedData, backgroundColor: 'rgba(76, 217, 100, 0.7)' },
                    { label: 'Valor Recusado', data: rejectedData, backgroundColor: 'rgba(255, 59, 48, 0.7)' }
                ]
            },
            options: {
                 responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                 scales: { x: { ticks: { color: '#8A8A7D' }, grid: { color: 'rgba(138, 138, 125, 0.1)' } }, y: { ticks: { color: '#E5E5E5' }, grid: { display: false } } },
                 plugins: { legend: { position: 'bottom', labels: { color: '#E5E5E5' } } }
            }
        });
         return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [quotes]);

    return <canvas ref={chartRef}></canvas>;
};

function ConversionEvolutionChart({ quotes }: { quotes: CommercialQuote[] }) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current || !quotes) return;

        const monthlyData: Record<string, { approved: number; rejected: number }> = {};
        quotes.filter(q => q.status === 'Aprovado' || q.status === 'Recusado').forEach(q => {
            const month = new Date(q.decisionDate!).toLocaleDateString('pt-BR', { year: '2-digit', month: 'short' });
            if (!monthlyData[month]) monthlyData[month] = { approved: 0, rejected: 0 };
            if (q.status === 'Aprovado') monthlyData[month].approved++;
            else monthlyData[month].rejected++;
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const labels = sortedMonths;
        const data = sortedMonths.map(month => {
            const { approved, rejected } = monthlyData[month];
            return (approved / (approved + rejected)) * 100;
        });

        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Taxa de Conversão (%)',
                    data,
                    borderColor: '#DCFF00',
                    backgroundColor: 'rgba(220, 255, 0, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                 responsive: true, maintainAspectRatio: false,
                 scales: { y: { beginAtZero: true, max: 100, ticks: { color: '#8A8A7D', callback: (v: any) => `${v}%` } }, x: { ticks: { color: '#E5E5E5' } } },
                 plugins: { legend: { display: false } }
            }
        });
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [quotes]);

    return <canvas ref={chartRef}></canvas>;
};

function DashboardContent() {
    const { quotes } = useAppContext();
    const [period, setPeriod] = useState('all');
    const [responsible, setResponsible] = useState('all');
    const [client, setClient] = useState('all');

    const responsibleList = useMemo(() => ['all', ...Array.from(new Set(quotes.map(q => q.responsible)))], [quotes]);
    const clientList = useMemo(() => ['all', ...Array.from(new Set(quotes.map(q => q.client)))], [quotes]);

    const filteredQuotes = useMemo(() => {
        const now = new Date();
        return quotes.filter(q => {
            if (responsible !== 'all' && q.responsible !== responsible) return false;
            if (client !== 'all' && q.client !== client) return false;
            if (period !== 'all') {
                const sentDate = new Date(q.sentDate);
                let startDate: Date | null = null;
                if (period === '7d') startDate = new Date(new Date().setDate(now.getDate() - 7));
                if (period === '30d') startDate = new Date(new Date().setMonth(now.getMonth() - 1));
                if (period === 'current_month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                if (startDate && sentDate < startDate) return false;
            }
            return true;
        });
    }, [quotes, period, responsible, client]);

    const kpiData = useMemo(() => {
        const negotiatingQuotes = filteredQuotes.filter(q => q.status === 'Enviado' || q.status === 'Em Negociação');
        const totalNegotiatingValue = negotiatingQuotes.reduce((sum, q) => sum + q.value, 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sentThisMonth = filteredQuotes.filter(q => new Date(q.sentDate) >= startOfMonth).length;

        const approved = filteredQuotes.filter(q => q.status === 'Aprovado');
        const rejected = filteredQuotes.filter(q => q.status === 'Recusado');
        const conversionRate = (approved.length + rejected.length) > 0 ? (approved.length / (approved.length + rejected.length)) * 100 : 0;
        
        const avgTicket = approved.length > 0 ? approved.reduce((sum, q) => sum + q.value, 0) / approved.length : 0;

        return { totalNegotiatingValue, conversionRate, sentThisMonth, avgTicket };
    }, [filteredQuotes]);
    
    const funnelData = useMemo(() => {
        const sent = filteredQuotes.filter(q => q.status === 'Enviado').length;
        const negotiating = filteredQuotes.filter(q => q.status === 'Em Negociação').length;
        const approved = filteredQuotes.filter(q => q.status === 'Aprovado').length;
        return { sent: sent + negotiating + approved, negotiating: negotiating + approved, approved };
    }, [filteredQuotes]);

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Filters */}
            <div className="flex-shrink-0 flex flex-col md:flex-row gap-2 items-center">
                <div className="flex items-center gap-2">
                    <button onClick={() => setPeriod('7d')} className={`px-3 py-1 text-sm rounded ${period === '7d' ? 'bg-cadmium-yellow text-coal-black font-semibold' : 'bg-black/30'}`}>7 dias</button>
                    <button onClick={() => setPeriod('30d')} className={`px-3 py-1 text-sm rounded ${period === '30d' ? 'bg-cadmium-yellow text-coal-black font-semibold' : 'bg-black/30'}`}>30 dias</button>
                    <button onClick={() => setPeriod('current_month')} className={`px-3 py-1 text-sm rounded ${period === 'current_month' ? 'bg-cadmium-yellow text-coal-black font-semibold' : 'bg-black/30'}`}>Mês Atual</button>
                    <button onClick={() => setPeriod('all')} className={`px-3 py-1 text-sm rounded ${period === 'all' ? 'bg-cadmium-yellow text-coal-black font-semibold' : 'bg-black/30'}`}>Tudo</button>
                </div>
                <div className="flex-grow" />
                <select value={responsible} onChange={e => setResponsible(e.target.value)} className="bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-1.5 text-sm w-full md:w-auto">
                    {responsibleList.map(r => <option key={r} value={r}>{r === 'all' ? 'Todos Responsáveis' : r}</option>)}
                </select>
                <select value={client} onChange={e => setClient(e.target.value)} className="bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-1.5 text-sm w-full md:w-auto">
                    {clientList.map(c => <option key={c} value={c}>{c === 'all' ? 'Todos Clientes' : c}</option>)}
                </select>
            </div>
            
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Valor em Negociação" value={kpiData.totalNegotiatingValue} icon={<Briefcase size={20} />} isCurrency />
                <KpiCard title="Taxa de Conversão" value={kpiData.conversionRate} icon={<TrendingUp size={20} />} isPercentage />
                <KpiCard title="Orçamentos Enviados (Mês)" value={kpiData.sentThisMonth} icon={<FileText size={20} />} />
                <KpiCard title="Ticket Médio Aprovado" value={kpiData.avgTicket} icon={<DollarSign size={20} />} isCurrency />
            </div>

            {/* Charts */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-4">Funil de Vendas</h3>
                        <div className="flex-1 flex items-center"><FunnelChart data={funnelData} /></div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-4">Motivos de Perda</h3>
                        <div className="flex-1 relative"><LossReasonChart quotes={filteredQuotes} /></div>
                    </div>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-4">
                     <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-4">Faturamento Potencial vs. Realizado</h3>
                        <div className="flex-1 relative"><ClientRevenueChart quotes={filteredQuotes} /></div>
                    </div>
                     <div className="bg-black/20 p-4 rounded-lg border border-granite-gray/20 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-4">Evolução da Taxa de Conversão</h3>
                        <div className="flex-1 relative"><ConversionEvolutionChart quotes={filteredQuotes} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CommercialDashboardPage: React.FC<CommercialDashboardPageProps> = ({ onConvertToOS }) => {
    const [activeTab, setActiveTab] = useState<CommercialTab>('dashboard');

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 border-b border-granite-gray/20 mb-4">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'border-b-2 border-cadmium-yellow text-cadmium-yellow' : 'text-granite-gray-light hover:text-white'}`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('quotes')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'quotes' ? 'border-b-2 border-cadmium-yellow text-cadmium-yellow' : 'text-granite-gray-light hover:text-white'}`}
                >
                    Orçamentos
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'dashboard' && <DashboardContent />}
                {activeTab === 'quotes' && <QuoteManagementPage onConvertToOS={onConvertToOS} />}
            </div>
        </div>
    );
};
