import React from 'react';
import { X, Copy } from 'lucide-react';
import { useAppContext } from './AppContext';
import { NotificationColorType } from '../types';

interface ProposalDraftModalProps {
    title: string;
    draft: string;
    onClose: () => void;
}

export const ProposalDraftModal: React.FC<ProposalDraftModalProps> = ({ title, draft, onClose }) => {
    const { addNotification } = useAppContext();

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        addNotification({ message: 'Rascunho da proposta copiado!', type: NotificationColorType.Success });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 modal-backdrop-animation" onClick={onClose}>
            <div className="bg-coal-black rounded-xl w-full max-w-2xl border border-granite-gray/20 shadow-2xl flex flex-col h-[80vh] modal-content-animation" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 p-6 flex justify-between items-center border-b border-granite-gray/20">
                    <div>
                        <h2 className="text-xl font-bold font-display">Rascunho da Proposta (IA)</h2>
                        <p className="text-sm text-granite-gray-light truncate max-w-md">{title}</p>
                    </div>
                    <button type="button" onClick={onClose}><X size={24} /></button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    <div
                        className="text-gray-300 space-y-4 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: draft.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, '<br />') }}
                    ></div>
                </div>
                <div className="flex-shrink-0 p-6 border-t border-granite-gray/20 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold bg-granite-gray/20 hover:bg-granite-gray/40">Fechar</button>
                    <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-cadmium-yellow text-coal-black hover:brightness-110">
                        <Copy size={16} /> Copiar Texto
                    </button>
                </div>
            </div>
        </div>
    );
};
