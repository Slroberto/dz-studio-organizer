import React from 'react';
import { Bot, Loader, X } from 'lucide-react';

interface FinancialInsightModalProps {
  isLoading: boolean;
  insightText: string;
  onClose: () => void;
}

export const FinancialInsightModal: React.FC<FinancialInsightModalProps> = ({ isLoading, insightText, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 modal-backdrop-animation"
      onClick={onClose}
    >
      <div
        className="bg-coal-black rounded-xl w-full max-w-lg border border-granite-gray/20 shadow-2xl modal-content-animation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-granite-gray/20 flex items-center justify-between">
          <div className="flex items-center">
            <Bot size={24} className="text-cadmium-yellow" />
            <h2 className="text-xl font-bold font-display ml-3">Análise Financeira (IA)</h2>
          </div>
          <button onClick={onClose} className="text-granite-gray-light hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 min-h-[200px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
                <Loader size={32} className="animate-spin text-cadmium-yellow mx-auto" />
                <p className="mt-4 text-granite-gray-light">Analisando dados financeiros...</p>
            </div>
          ) : (
            <div className="text-gray-300 space-y-4 whitespace-pre-wrap">
              {insightText.split('\n\n').map((paragraph, index) => {
                const htmlContent = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/R\$\s([\d,.]+)/g, '<strong class="text-green-400">R$ $1</strong>')
                    .replace(/(\d+)\s(projeto)/g, '<strong class="text-yellow-400">$1 $2</strong>')
                    .replace(/(\d{1,3}\.\d+%)/g, '<strong class="text-blue-400">$1</strong>');

                return <p key={index} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};