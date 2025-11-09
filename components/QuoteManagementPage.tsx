import React, { useState, useMemo } from 'react';
// FIX: Removed incorrect import of 'Partial'. It is a built-in TypeScript utility type.
import { CommercialQuote, QuoteStatus, UserRole } from '../types';
import { useAppContext } from './AppContext';
import { PlusCircle, Search, Edit, FileText, Repeat, CheckCircle, Trash2, X } from 'lucide-react';
import { generateQuotePDF } from '../services/pdfService';

interface QuoteManagementPageProps {
    onConvertToOS: (quote: CommercialQuote) => void;
    onOpenEditor: (quote: Partial<CommercialQuote> | null) => void;
}

const statusConfig: Record<QuoteStatus, { color: string, label: string }> = {
    [QuoteStatus.Draft]: { color: 'bg-gray-500', label: 'Rascunho' },
    [QuoteStatus.Sent]: { color: 'bg-blue-500', label: 'Enviado' },
    [QuoteStatus.Negotiating]: { color: 'bg-purple-500', label: 'Em Negociação' },
    [QuoteStatus.Approved]: { color: 'bg-green-500', label: 'Aprovado' },
    [QuoteStatus.Rejected]: { color: 'bg-red-500', label: 'Recusado' },
};

export const QuoteManagementPage: React.FC<QuoteManagementPageProps> = ({ onConvertToOS, onOpenEditor }) => {
    const { quotes, addQuote, deleteQuote, currentUser } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const canEdit = currentUser?.role !== UserRole.Viewer;

    const handleDuplicate = async (quote: CommercialQuote) => {
        const newQuoteData: Omit<CommercialQuote, 'id' | 'value'> = {
            ...quote,
            quoteNumber: `ORC-${new Date().getFullYear()}-${quotes.length + 1}`,
            status: QuoteStatus.Draft,
            sentDate: new Date().toISOString(),
        };
        await addQuote(newQuoteData);
    };
    
    const handleDelete = async (quote: CommercialQuote) => {
        if (window.confirm(`Tem certeza que deseja excluir o orçamento ${quote.quoteNumber} para ${quote.client}?`)) {
            await deleteQuote(quote.id);
        }
    }

    const filteredQuotes = useMemo(() => {
        const sorted = [...quotes].sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
        if (!searchTerm) return sorted;
        const lowercasedTerm = searchTerm.toLowerCase();
        return sorted.filter(q =>
            q.client.toLowerCase().includes(lowercasedTerm) ||
            q.quoteNumber.toLowerCase().includes(lowercasedTerm) ||
            q.status.toLowerCase().includes(lowercasedTerm)
        );
    }, [quotes, searchTerm]);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-auto">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, nº ou status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-72 bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm"
                    />
                     {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-granite-gray hover:text-white">
                            <X size={16} />
                        </button>
                    )}
                </div>
                {canEdit && (
                    <button
                        onClick={() => onOpenEditor(null)}
                        className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110"
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Criar Novo Orçamento
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-3">
                    {filteredQuotes.map(quote => (
                        <div key={quote.id} className="bg-coal-black p-4 rounded-lg border border-granite-gray/20 flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`w-3 h-3 rounded-full ${statusConfig[quote.status].color}`}></span>
                                    <p className="font-bold text-lg text-white truncate">{quote.client}</p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-granite-gray-light">
                                    <span>{quote.quoteNumber}</span>
                                    <span>|</span>
                                    <span>{new Date(quote.sentDate).toLocaleDateString('pt-BR')}</span>
                                    <span>|</span>
                                    <span className="font-semibold text-gray-300">{quote.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </div>
                            {canEdit && (
                                <div className="flex-shrink-0 flex items-center gap-2 self-end md:self-center">
                                    {quote.status === QuoteStatus.Approved && (
                                        <button onClick={() => onConvertToOS(quote)} title="Converter em OS" className="p-2 bg-green-500/20 text-green-300 rounded hover:bg-green-500/40"><CheckCircle size={18} /></button>
                                    )}
                                    <button onClick={() => generateQuotePDF(quote)} title="Gerar PDF" className="p-2 bg-granite-gray/20 text-gray-300 rounded hover:bg-granite-gray/40"><FileText size={18} /></button>
                                    <button onClick={() => handleDuplicate(quote)} title="Duplicar" className="p-2 bg-granite-gray/20 text-gray-300 rounded hover:bg-granite-gray/40"><Repeat size={18} /></button>
                                    <button onClick={() => onOpenEditor(quote)} title="Editar" className="p-2 bg-granite-gray/20 text-gray-300 rounded hover:bg-granite-gray/40"><Edit size={18} /></button>
                                     <button onClick={() => handleDelete(quote)} title="Excluir" className="p-2 bg-red-500/20 text-red-300 rounded hover:bg-red-500/40"><Trash2 size={18} /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};