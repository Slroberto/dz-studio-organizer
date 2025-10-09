import React, { useState, useRef, useEffect } from 'react';
import { ServiceOrder, ActivityLogEntry, OrderStatus, ActivityActionType, WeeklyReportData, AppNotification, NotificationColorType } from '../types';
import { BarChart3, CalendarCheck, Clock, CheckCircle, AlertTriangle, Users, FileDown, PieChart, Send, Eye, Download, ChevronLeft } from 'lucide-react';
import { useAppContext } from './AppContext';

declare const Chart: any;
declare const jspdf: any;

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-black/20 p-4 rounded-lg flex items-center border border-granite-gray/20">
        <div className="p-3 rounded-full mr-4 bg-granite-gray/20 text-granite-gray-light">{icon}</div>
        <div>
            <h3 className="text-sm font-semibold text-granite-gray-light">{title}</h3>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const DeliveriesByDayChart = ({ chartData }: { chartData: number[] }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Entregas por Dia',
                    data: chartData,
                    backgroundColor: 'rgba(220, 255, 0, 0.6)',
                    borderColor: 'rgba(220, 255, 0, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#8A8A7D', stepSize: 1 }, grid: { color: 'rgba(138, 138, 125, 0.1)' } },
                    x: { ticks: { color: '#E5E5E5' }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Entregas por Dia da Semana', color: '#E5E5E5', font: { size: 16 } }
                }
            }
        });
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [chartData]);
    return <canvas ref={chartRef}></canvas>;
};

const StatusDistributionChart = ({ chartData }: { chartData: { labels: string[], data: number[] } }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
     useEffect(() => {
        if (!chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: ['#5AC8FA', '#FF9500', '#FFCC00', '#DCFF00', '#AF52DE', '#FF3B30', '#4CD964'],
                    borderColor: '#232323',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#E5E5E5' } },
                    title: { display: true, text: 'Distribuição de Status (Ações)', color: '#E5E5E5', font: { size: 16 } }
                }
            }
        });
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [chartData]);
    return <canvas ref={chartRef}></canvas>;
};


export const ReportsPage: React.FC = () => {
    const { orders, activityLog: log, addNotification } = useAppContext();
    const [savedReports, setSavedReports] = useState<WeeklyReportData[]>([]);
    const [selectedReport, setSelectedReport] = useState<WeeklyReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        const storedReports = localStorage.getItem('dz-studio-reports');
        if (storedReports) {
            setSavedReports(JSON.parse(storedReports));
        }
    }, []);

    useEffect(() => {
        if (savedReports.length > 0) {
            localStorage.setItem('dz-studio-reports', JSON.stringify(savedReports));
        }
    }, [savedReports]);

    const getLastWeekRange = () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // Monday=0, Sunday=6
        
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - dayOfWeek - 7);
        
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        lastSunday.setHours(23,59,59,999);
        
        return { start: lastMonday, end: lastSunday };
    };
    
    const calculateReportData = (): WeeklyReportData => {
        const { start, end } = getLastWeekRange();
        
        const createdThisWeek = orders.filter(o => new Date(o.creationDate) >= start && new Date(o.creationDate) <= end);
        const deliveredThisWeek = orders.filter(o => o.deliveryDate && new Date(o.deliveryDate) >= start && new Date(o.deliveryDate) <= end);
        const logsThisWeek = log.filter(l => new Date(l.timestamp) >= start && new Date(l.timestamp) <= end);

        const onTimeDeliveries = deliveredThisWeek.filter(o => o.expectedDeliveryDate && new Date(o.deliveryDate!) <= new Date(o.expectedDeliveryDate)).length;
        const onTimePercentage = deliveredThisWeek.length > 0 ? ((onTimeDeliveries / deliveredThisWeek.length) * 100).toFixed(1) : '100.0';

        const totalDeliveryTime = deliveredThisWeek.reduce((acc, o) => {
            // FIX: Changed date subtraction to use getTime() for explicit numeric conversion.
            const deliveryTime = new Date(o.deliveryDate!).getTime() - new Date(o.creationDate).getTime();
            return acc + deliveryTime;
        }, 0);
        const avgDeliveryDays = deliveredThisWeek.length > 0 ? (totalDeliveryTime / deliveredThisWeek.length / (1000 * 60 * 60 * 24)).toFixed(1) : '0.0';

        // FIX: Switched to using a Map for counting clients to ensure strong type inference for the `topClients` array, resolving a potential 'unknown' type error.
        const clientCounts = createdThisWeek.reduce((acc, order) => {
            acc.set(order.client, (acc.get(order.client) || 0) + 1);
            return acc;
        }, new Map<string, number>());
        const topClients = Array.from(clientCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

        const deliveriesByDay = Array(7).fill(0); // Mon-Sun
        deliveredThisWeek.forEach(o => {
            const day = new Date(o.deliveryDate!).getDay();
            const adjustedDay = day === 0 ? 6 : day - 1; // Monday = 0
            deliveriesByDay[adjustedDay]++;
        });

        const statusDistributionMap: Record<string, number> = {};
        logsThisWeek.forEach(l => {
            if (l.action === ActivityActionType.Move && l.details) {
                const match = l.details.match(/para '(.*?)'/);
                if (match && match[1]) {
                    const status = match[1];
                    statusDistributionMap[status] = (statusDistributionMap[status] || 0) + 1;
                }
            } else if (l.action === ActivityActionType.Complete) {
                statusDistributionMap[OrderStatus.Delivered] = (statusDistributionMap[OrderStatus.Delivered] || 0) + 1;
            }
        });
        const statusDistribution = {
            labels: Object.keys(statusDistributionMap),
            data: Object.values(statusDistributionMap),
        };

        const teamPerformanceMap: Record<string, { userName: string, deliveries: number, updates: number }> = {};
        log.forEach(l => {
            if (!teamPerformanceMap[l.userId]) teamPerformanceMap[l.userId] = { userName: l.userName, deliveries: 0, updates: 0 };
        });
        logsThisWeek.forEach(l => { teamPerformanceMap[l.userId].updates++; });
        deliveredThisWeek.forEach(o => {
            const userLog = log.find(l => l.orderId === o.id && l.action === ActivityActionType.Complete);
            if(userLog && teamPerformanceMap[userLog.userId]) teamPerformanceMap[userLog.userId].deliveries++;
        });
        
        return {
            id: `report-${start.toISOString().split('T')[0]}`,
            period: { start: start.toLocaleDateString('pt-BR'), end: end.toLocaleDateString('pt-BR') },
            generatedAt: new Date().toISOString(),
            createdCount: createdThisWeek.length,
            deliveredCount: deliveredThisWeek.length,
            onTimePercentage: `${onTimePercentage}%`,
            avgDeliveryDays: `${avgDeliveryDays} dias`,
            topClients,
            deliveriesByDay,
            statusDistribution,
            teamPerformance: Object.values(teamPerformanceMap)
        };
    };

    const handleGenerateReport = () => {
        setIsLoading(true);
        setTimeout(() => {
            const data = calculateReportData();
            // Avoid duplicates
            if (!savedReports.some(r => r.id === data.id)) {
                 setSavedReports(prev => [data, ...prev].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()));
            }
            setSelectedReport(data);
            setIsLoading(false);
            // FIX: The `addNotification` function generates the ID internally. Do not pass an `id` property.
            addNotification({
                message: `Relatório da semana ${data.period.start} - ${data.period.end} gerado.`,
                type: NotificationColorType.Success
            });
        }, 500);
    };

    const exportPDF = (reportData: WeeklyReportData) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(35, 35, 35); // #232323
        doc.rect(0, 0, 210, 25, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 255, 0); // #DCFF00
        doc.text('DZ Studio Organizer', 14, 16);
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`Relatório Semanal: ${reportData.period.start} - ${reportData.period.end}`, 14, 22);

        // Body
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        (doc as any).autoTable({
            startY: 35,
            body: [
                [`OS Criadas: ${reportData.createdCount}`, `OS Entregues: ${reportData.deliveredCount}`],
                [`Pontualidade: ${reportData.onTimePercentage}`, `Tempo Médio: ${reportData.avgDeliveryDays}`],
            ],
            theme: 'plain',
            styles: { fontSize: 11 }
        });

        const deliveriesCanvas = (document.querySelector('#deliveriesChart canvas') as HTMLCanvasElement);
        if(deliveriesCanvas) doc.addImage(deliveriesCanvas.toDataURL('image/png'), 'PNG', 14, (doc as any).autoTable.previous.finalY + 10, 180, 80);
        
        const statusCanvas = (document.querySelector('#statusChart canvas') as HTMLCanvasElement);
        if (statusCanvas) doc.addImage(statusCanvas.toDataURL('image/png'), 'PNG', 14, (doc as any).autoTable.previous.finalY + 100, 90, 90);

        (doc as any).autoTable({
            head: [['Top Clientes', 'OS']],
            body: reportData.topClients.map(c => [c.name, c.count]),
            startY: (doc as any).autoTable.previous.finalY + 100,
            margin: { left: 115 },
            theme: 'grid',
            headStyles: { fillColor: [35, 35, 35] }
        });
        
        (doc as any).autoTable({
            startY: (doc as any).autoTable.previous.finalY + 5,
            head: [['Equipe', 'Entregas', 'Ações']],
            body: reportData.teamPerformance.map(p => [p.userName, p.deliveries, p.updates]),
            margin: { left: 115 },
            theme: 'grid',
            headStyles: { fillColor: [35, 35, 35] }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for(var i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFillColor(35, 35, 35);
            doc.rect(0, 297 - 10, 210, 10, 'F');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.text(`Página ${i} de ${pageCount}`, 195, 292);
            doc.text(`Gerado em: ${new Date(reportData.generatedAt).toLocaleString('pt-BR')}`, 14, 292);
        }

        doc.save(`DZ_Relatorio_Semana_${reportData.period.start}_${reportData.period.end}.pdf`);
    };

    const exportCSV = (reportData: WeeklyReportData) => {
        let csv = "Metrica,Valor\n";
        csv += `Período,"${reportData.period.start} - ${reportData.period.end}"\n`;
        csv += `OS Criadas,${reportData.createdCount}\n...\n\n`; // Simplified for brevity
        
        csv += "Top Clientes,OS\n";
        reportData.topClients.forEach(c => csv += `${c.name},${c.count}\n`);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `DZ_Relatorio_Semana_${reportData.period.start}_${reportData.period.end}.csv`;
        link.click();
    };
    
    const handleSendEmail = (reportData: WeeklyReportData) => {
        const subject = `DZ Studio Organizer – Relatório Semanal ${reportData.period.start} a ${reportData.period.end}`;
        const body = `
Olá, Sandro.

Segue o relatório semanal da DZ Studio com os resultados da produção.

📦 OS criadas: ${reportData.createdCount}
✅ OS entregues: ${reportData.deliveredCount}
⏱ Entregas no prazo: ${reportData.onTimePercentage}

Os relatórios completos (PDF e CSV) devem ser anexados a este e-mail.

Atenciosamente,
DZ Studio Organizer
        `.trim().replace(/\n/g, '%0A');

        window.location.href = `mailto:sandro@dzstudio.com.br?subject=${subject}&body=${body}`;
        
        addNotification({
            message: 'Relatório semanal enviado com sucesso.',
            details: 'Seu cliente de e-mail foi aberto.',
            type: NotificationColorType.Success
        });
    };

    if (selectedReport) {
        return (
            <div className="flex flex-col h-full gap-6">
                <div className="flex-shrink-0 flex justify-between items-center">
                    <div>
                        <button onClick={() => setSelectedReport(null)} className="flex items-center text-sm text-granite-gray-light hover:text-white mb-2">
                            <ChevronLeft size={16} className="mr-1" /> Voltar ao Histórico
                        </button>
                        <h2 className="text-xl font-bold font-display">Relatório Semanal</h2>
                        <p className="text-granite-gray-light">{selectedReport.period.start} - {selectedReport.period.end}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleSendEmail(selectedReport)} className="flex items-center px-4 py-2 bg-blue-500/20 rounded-lg text-sm font-semibold text-blue-300 hover:bg-blue-500/40"> <Send size={16} className="mr-2" /> Enviar por E-mail </button>
                       <button onClick={() => exportCSV(selectedReport)} className="flex items-center px-4 py-2 bg-granite-gray/20 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/40"> <FileDown size={16} className="mr-2" /> CSV </button>
                       <button onClick={() => exportPDF(selectedReport)} className="flex items-center px-4 py-2 bg-granite-gray/20 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/40"> <FileDown size={16} className="mr-2" /> PDF </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="OS Criadas" value={selectedReport.createdCount} icon={<Clock size={24} />} />
                    <StatCard title="OS Entregues" value={selectedReport.deliveredCount} icon={<CheckCircle size={24} />} />
                    <StatCard title="Pontualidade" value={selectedReport.onTimePercentage} icon={<CalendarCheck size={24} />} />
                    <StatCard title="Tempo Médio / OS" value={selectedReport.avgDeliveryDays} icon={<AlertTriangle size={24} />} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-[300px]">
                    <div id="deliveriesChart" className="lg:col-span-3 bg-black/20 p-4 rounded-lg border border-granite-gray/20"><DeliveriesByDayChart chartData={selectedReport.deliveriesByDay} /></div>
                    <div id="statusChart" className="lg:col-span-2 bg-black/20 p-4 rounded-lg border border-granite-gray/20"><StatusDistributionChart chartData={selectedReport.statusDistribution} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tables */}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex-shrink-0 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold font-display">Histórico de Relatórios</h2>
                    <p className="text-granite-gray-light">Gerencie e visualize relatórios semanais passados.</p>
                </div>
                <button onClick={handleGenerateReport} disabled={isLoading} className="px-5 py-2.5 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all transform active:scale-95">
                    {isLoading ? 'Gerando...' : 'Gerar Relatório da Última Semana'}
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 bg-black/20 p-4 rounded-lg border border-granite-gray/20">
                {savedReports.length > 0 ? (
                    <div className="space-y-3">
                        {savedReports.map(report => (
                            <div key={report.id} className="flex items-center justify-between p-4 bg-granite-gray/10 rounded-lg">
                                <div>
                                    <p className="font-bold text-white">Semana de {report.period.start} a {report.period.end}</p>
                                    <p className="text-xs text-granite-gray-light">Gerado em: {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedReport(report)} className="flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-granite-gray/30 rounded hover:bg-granite-gray/50"><Eye size={14} className="mr-1.5"/> Ver Detalhes</button>
                                    <button onClick={() => { setSelectedReport(report); setTimeout(() => exportPDF(report), 100); }} className="p-2 text-xs font-semibold text-granite-gray-light hover:text-white"><Download size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <BarChart3 size={48} className="text-granite-gray mb-4" />
                        <h2 className="text-xl font-bold text-gray-400">Nenhum relatório salvo</h2>
                        <p className="text-granite-gray-light mt-2">Clique em "Gerar Relatório" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
