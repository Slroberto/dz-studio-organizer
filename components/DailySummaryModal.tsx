
import React from 'react';
// FIX: Importing DailySummaryData from types.ts to break circular dependency.
import { ServiceOrder, DailySummaryData } from '../types';
import { Bot, Check, Clock, Inbox, AlertTriangle, Send, X } from 'lucide-react';
import { useAppContext } from './AppContext';

interface DailySummaryModalProps {
  summary: DailySummaryData;
  onClose: () => void;
}

const SummaryItem = ({ icon, value, label, colorClass }: { icon: React.ReactNode, value: number | string, label: string, colorClass: string }) => (
    <div className={`flex items-center p-3 bg-black/20 rounded-lg ${colorClass}`}>
        {icon}
        <div className="ml-3">
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
        </div>
    </div>
);


export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({ summary, onClose }) => {
  const { setIsStalledFilterActive, setCurrentPage, clearFilters } = useAppContext();

  const handleViewPending = () => {
    onClose();
    clearFilters();
    setIsStalledFilterActive(true);
    setCurrentPage('Produção');
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 modal-backdrop-animation"
      onClick={onClose}
    >
      <div 
        className="bg-coal-black rounded-xl w-full max-w-lg border border-granite-gray/20 shadow-2xl modal-content-animation"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-granite-gray/20 flex items-center justify-between">
            <div className="flex items-center">
                <Bot size={24} className="text-cadmium-yellow" />
                <h2 className="text-xl font-bold font-display ml-3">Resumo Diário Inteligente</h2>
            </div>
            <button onClick={onClose} className="text-granite-gray-light hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>
        <div className="p-6">
            <p className="text-lg text-gray-300 mb-6">Bom dia, <span className="font-bold text-white">{summary.userName}</span>. Aqui está um resumo do seu dia:</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
                <SummaryItem icon={<Clock size={24} />} value={summary.inProgress} label="Em andamento" colorClass="border-l-4 border-blue-500" />
                <SummaryItem icon={<Inbox size={24} />} value={summary.waiting} label="Aguardando produto" colorClass="border-l-4 border-purple-500" />
                <SummaryItem icon={<Check size={24} />} value={summary.delivered} label="Concluídas" colorClass="border-l-4 border-green-500" />
            </div>

            {summary.stalled.length > 0 && (
                 <div className="p-4 bg-red-900/40 border border-red-500/50 rounded-lg mb-4">
                    <div className="flex items-center text-red-300">
                        <AlertTriangle size={20} className="mr-3"/>
                        <p className="font-semibold">{summary.stalled.length} OS {summary.stalled.length > 1 ? 'estão paradas' : 'está parada'} há mais de 2 dias.</p>
                    </div>
                 </div>
            )}

            {summary.dueToday > 0 && (
                <div className="p-4 bg-yellow-900/40 border border-yellow-500/50 rounded-lg mb-6">
                    <div className="flex items-center text-yellow-200">
                        <Send size={20} className="mr-3"/>
                        <p className="font-semibold">{summary.dueToday} {summary.dueToday > 1 ? 'entregas previstas' : 'entrega prevista'} para hoje.</p>
                    </div>
                </div>
            )}
            
            <div className="flex justify-end space-x-4">
                 <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleViewPending}
                  disabled={summary.stalled.length === 0}
                  className="px-6 py-2 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ver Pendências
                </button>
          </div>
        </div>
      </div>
    </div>
  );
};