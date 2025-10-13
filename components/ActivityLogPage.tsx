import React, { useState, useMemo } from 'react';
import { ActivityLogEntry, ActivityActionType } from '../types';
// FIX: Added MessageSquare and CheckSquare to imports for new action types.
import { PlusCircle, Edit3, Trash2, ArrowRightCircle, CheckCircle, User, Search, FileDown, MessageSquare, CheckSquare } from 'lucide-react';
import { useAppContext } from './AppContext';

// This lets TypeScript know that `jspdf` will be available on the global scope
// from the script tag loaded in index.html.
declare const jspdf: any;


// Helper to format time relative to now
const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours} h`;
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  
  return date.toLocaleDateString('pt-BR');
};

// FIX: Added missing action types (Comment, TaskAdd, TaskComplete) to satisfy the Record type.
const actionIcons: Record<ActivityActionType, React.ReactNode> = {
  [ActivityActionType.Create]: <PlusCircle size={20} className="text-green-500" />,
  [ActivityActionType.Update]: <Edit3 size={20} className="text-yellow-500" />,
  [ActivityActionType.Delete]: <Trash2 size={20} className="text-red-500" />,
  [ActivityActionType.Move]: <ArrowRightCircle size={20} className="text-purple-500" />,
  [ActivityActionType.Complete]: <CheckCircle size={20} className="text-green-500" />,
  [ActivityActionType.Comment]: <MessageSquare size={20} className="text-blue-400" />,
  [ActivityActionType.TaskAdd]: <PlusCircle size={20} className="text-cyan-400" />,
  [ActivityActionType.TaskComplete]: <CheckSquare size={20} className="text-teal-400" />,
};

export const ActivityLogPage: React.FC = () => {
  const { activityLog: log } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const processedLog = useMemo(() => {
    let filtered = log;

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = log.filter(entry => 
            entry.userName.toLowerCase().includes(lowercasedTerm) ||
            entry.orderNumber.toLowerCase().includes(lowercasedTerm) ||
            entry.clientName.toLowerCase().includes(lowercasedTerm) ||
            entry.action.toLowerCase().includes(lowercasedTerm) ||
            (entry.details && entry.details.toLowerCase().includes(lowercasedTerm))
        );
    }

    let sorted = [...filtered];
    if (sortBy === 'date-desc') {
        sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'date-asc') {
        sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (sortBy === 'action') {
        sorted.sort((a, b) => a.action.localeCompare(b.action));
    }

    return sorted;
  }, [log, searchTerm, sortBy]);
  
  const getDateRangeForFilename = (logEntries: ActivityLogEntry[]): { start: string, end: string } => {
    if (logEntries.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return { start: today, end: today };
    }
    // Sort by timestamp to find the real start and end
    const sortedEntries = [...logEntries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const start = new Date(sortedEntries[0].timestamp).toISOString().split('T')[0];
    const end = new Date(sortedEntries[sortedEntries.length - 1].timestamp).toISOString().split('T')[0];
    return { start, end };
  };

  const handleExportCSV = () => {
    if (processedLog.length === 0) {
        alert("Nenhum registro para exportar.");
        return;
    }

    const headers = ['Timestamp', 'Usuário', 'Ação', 'OS', 'Cliente', 'Detalhes'];
    const rows = processedLog.map(entry => [
        `"${new Date(entry.timestamp).toLocaleString('pt-BR')}"`,
        `"${entry.userName.replace(/"/g, '""')}"`,
        `"${entry.action.replace(/"/g, '""')}"`,
        `"${entry.orderNumber.replace(/"/g, '""')}"`,
        `"${entry.clientName.replace(/"/g, '""')}"`,
        `"${(entry.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const { start, end } = getDateRangeForFilename(processedLog);
    link.setAttribute("download", `DZ_Log_${start}_${end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (processedLog.length === 0) {
        alert("Nenhum registro para exportar.");
        return;
    }
    
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const { start, end } = getDateRangeForFilename(processedLog);

    doc.text(`Log de Atividade - DZ Studio`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Período do relatório (com base nos filtros): ${start} a ${end}`, 14, 22);

    (doc as any).autoTable({
        startY: 28,
        head: [['Data', 'Usuário', 'Ação', 'OS', 'Cliente', 'Detalhes']],
        body: processedLog.map(entry => [
            new Date(entry.timestamp).toLocaleString('pt-BR'),
            entry.userName,
            entry.action,
            entry.orderNumber,
            entry.clientName,
            entry.details || ''
        ]),
        headStyles: { fillColor: [35, 35, 35] }, // #232323
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 40 },
            5: { cellWidth: 'auto' },
        }
    });

    doc.save(`DZ_Log_${start}_${end}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between mb-6 gap-4">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                <input
                    type="text"
                    placeholder="Buscar por usuário, OS, cliente, ação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                    aria-label="Search activity log"
                />
            </div>
            <div className="flex items-center gap-4">
                 <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                    aria-label="Sort activity log"
                 >
                    <option value="date-desc">Mais Recentes</option>
                    <option value="date-asc">Mais Antigos</option>
                    <option value="action">Tipo de Ação</option>
                 </select>
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center px-4 py-2 bg-granite-gray/20 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/40 transition-colors"
                        title="Exportar para CSV"
                    >
                        <FileDown size={16} className="mr-2"/>
                        CSV
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center px-4 py-2 bg-granite-gray/20 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/40 transition-colors"
                        title="Exportar para PDF"
                    >
                        <FileDown size={16} className="mr-2"/>
                        PDF
                    </button>
                 </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
            {processedLog.length > 0 ? (
            <div className="space-y-3">
              {processedLog.map((entry, index) => (
                <div key={entry.id} className={`flex items-start p-3 rounded-lg border border-transparent ${index % 2 === 0 ? 'bg-black/20' : ''}`}>
                  <div className="flex-shrink-0 mt-1 mr-4">{actionIcons[entry.action]}</div>
                  <div className="flex-grow">
                    <p className="text-gray-200">
                      <span className="font-bold">{entry.userName}</span> {entry.action}{' '}
                      <span className="font-semibold text-cadmium-yellow/90">
                        {entry.clientName} ({entry.orderNumber})
                      </span>
                      .
                    </p>
                    {entry.details && (
                      <p className="text-sm text-granite-gray-light mt-1">{entry.details}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right ml-4">
                    <p className="text-sm text-granite-gray-light whitespace-nowrap">{formatRelativeTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
                <User size={48} className="mx-auto text-granite-gray mb-4" />
                <h2 className="text-xl font-bold text-gray-400">Nenhuma atividade encontrada</h2>
                <p className="text-granite-gray-light mt-2">Tente ajustar seus filtros de busca.</p>
            </div>
          )}
        </div>
    </div>
  );
};