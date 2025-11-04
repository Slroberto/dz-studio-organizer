import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CommercialQuote, QuoteItem, QuoteStatus, CatalogServiceItem } from '../types';
import { useAppContext } from './AppContext';
import { X, Plus, Trash2, Percent, DollarSign } from 'lucide-react';
import { ServiceItemFormModal } from './ServiceItemFormModal';

interface QuoteEditorModalProps {
  quote: CommercialQuote | null;
  onClose: () => void;
  onSave: (quote: CommercialQuote) => void;
}

const emptyQuote: Omit<CommercialQuote, 'id' | 'responsible' | 'value'> = {
    quoteNumber: '',
    client: '',
    status: QuoteStatus.Draft,
    sentDate: new Date().toISOString(),
    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    items: [{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }],
    discountType: 'fixed',
    discountValue: 0,
    terms: 'Pagamento em 2x. 50% de entrada e 50% na entrega.',
};

export const QuoteEditorModal: React.FC<QuoteEditorModalProps> = ({ quote, onClose, onSave }) => {
    const { quotes, currentUser, catalogServices, addCatalogService } = useAppContext();
    const [formData, setFormData] = useState<Omit<CommercialQuote, 'id' | 'value' | 'responsible'>>(emptyQuote);
    const [suggestions, setSuggestions] = useState<CatalogServiceItem[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<string | null>(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (quote) {
            setFormData(quote);
        } else {
             const nextQuoteNumber = `ORC-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`;
             setFormData(prev => ({ ...prev, quoteNumber: nextQuoteNumber }));
        }
    }, [quote, quotes.length]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'validUntil' || name === 'sentDate') {
            const date = new Date(value);
            date.setHours(12);
            setFormData(prev => ({...prev, [name]: date.toISOString() }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleItemChange = (itemId: string, field: keyof QuoteItem, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'description' && typeof value === 'string') {
                        if (value.trim() === '') {
                             setSuggestions(catalogServices.slice(0, 5));
                        } else {
                            const filtered = catalogServices.filter(s => 
                                s.title.toLowerCase().includes(value.toLowerCase()) || 
                                s.description.toLowerCase().includes(value.toLowerCase())
                            );
                            setSuggestions(filtered.slice(0, 5));
                        }
                        setActiveSuggestionBox(itemId);
                    }
                    return updatedItem;
                }
                return item;
            })
        }));
    };

    const handleDescriptionFocus = (itemId: string, currentDescription: string) => {
        if (currentDescription.trim() === '') {
            setSuggestions(catalogServices.slice(0, 5));
            setActiveSuggestionBox(itemId);
        }
    };

    const handleSuggestionClick = (itemId: string, service: CatalogServiceItem) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => 
                item.id === itemId 
                ? { ...item, description: service.title, unitPrice: service.price, quantity: 1 } 
                : item
            )
        }));
        setSuggestions([]);
        setActiveSuggestionBox(null);
    };

    const handleInputBlur = () => {
        suggestionTimeoutRef.current = setTimeout(() => {
            setSuggestions([]);
            setActiveSuggestionBox(null);
        }, 150);
    };

    useEffect(() => {
        return () => {
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
            }
        };
    }, []);
    
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]
        }));
    };
    
    const removeItem = (itemId: string) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
            setSuggestions([]);
            setActiveSuggestionBox(null);
        }
    };
    
    const { subtotal, discountAmount, total } = useMemo(() => {
        const sub = formData.items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
        let discount = 0;
        if (formData.discountType === 'percentage') {
            discount = sub * ((Number(formData.discountValue) || 0) / 100);
        } else {
            discount = Number(formData.discountValue) || 0;
        }
        const tot = Math.max(0, sub - discount); // Garante que o total não seja negativo
        return { subtotal: sub, discountAmount: discount, total: tot };
    }, [formData.items, formData.discountType, formData.discountValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalQuote: CommercialQuote = {
            id: quote?.id || '',
            ...formData,
            responsible: quote?.responsible || currentUser?.name || 'N/A',
            value: total,
        };
        onSave(finalQuote);
    };

    const handleSaveNewService = async (service: CatalogServiceItem) => {
        const { id, ...newServiceData } = service;
        await addCatalogService(newServiceData);
        setIsServiceModalOpen(false);
    };

    return (
        <>
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 modal-backdrop-animation" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-coal-black rounded-xl w-full max-w-4xl border border-granite-gray/20 shadow-2xl flex flex-col h-[95vh] modal-content-animation" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 p-6 flex justify-between items-center border-b border-granite-gray/20">
                    <h2 className="text-2xl font-bold font-display">{quote ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
                    <button type="button" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {/* Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input name="client" value={formData.client} onChange={handleInputChange} placeholder="Nome do Cliente" required className="bg-black/30 p-2 rounded border border-granite-gray/50" />
                        <input name="quoteNumber" value={formData.quoteNumber} onChange={handleInputChange} placeholder="Nº do Orçamento" required className="bg-black/30 p-2 rounded border border-granite-gray/50" />
                         <select name="status" value={formData.status} onChange={handleInputChange} className="bg-black/30 p-2 rounded border border-granite-gray/50">
                            {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="md:col-span-1">
                            <label className="text-xs text-granite-gray-light">Data de Envio</label>
                            <input type="date" name="sentDate" value={formData.sentDate.split('T')[0]} onChange={handleInputChange} required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                        </div>
                        <div className="md:col-span-1">
                             <label className="text-xs text-granite-gray-light">Validade</label>
                            <input type="date" name="validUntil" value={formData.validUntil.split('T')[0]} onChange={handleInputChange} required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                        </div>
                    </div>
                    {/* Items */}
                    <div className="space-y-2">
                        {formData.items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center relative">
                                <div className="col-span-6 relative">
                                    <input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} onFocus={() => handleDescriptionFocus(item.id, item.description)} onBlur={handleInputBlur} placeholder={`Descrição do Item ${index + 1}`} required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" autoComplete="off" />
                                    {activeSuggestionBox === item.id && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-coal-black border border-granite-gray/50 rounded-lg z-10 shadow-lg max-h-48 overflow-y-auto">
                                            {suggestions.map(s => (
                                                <div key={s.id} onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(item.id, s); }} className="p-2 hover:bg-granite-gray/20 cursor-pointer">
                                                    <p className="font-semibold text-white">{s.title}</p>
                                                    <p className="text-xs text-granite-gray-light">{s.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                </div>
                                            ))}
                                             <div className="p-3 border-t border-granite-gray/20 text-center" onMouseDown={(e) => { e.preventDefault(); setIsServiceModalOpen(true); }}>
                                                <span className="text-sm font-semibold text-cadmium-yellow cursor-pointer hover:text-white">
                                                    + Adicionar novo serviço ao catálogo
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} min="0" placeholder="Qtd." required className="col-span-2 bg-black/30 p-2 rounded border border-granite-gray/50" />
                                <div className="col-span-3 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray">R$</span>
                                    <input type="number" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', Number(e.target.value))} min="0" step="0.01" placeholder="Preço" required className="w-full bg-black/30 p-2 pl-9 text-right rounded border border-granite-gray/50" />
                                </div>
                                <button type="button" onClick={() => removeItem(item.id)} className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-50" disabled={formData.items.length <= 1}><Trash2 size={18} /></button>
                            </div>
                        ))}
                         <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm font-semibold text-cadmium-yellow"><Plus size={16} /> Adicionar Item</button>
                    </div>

                    {/* Terms */}
                    <div>
                        <label className="text-sm font-medium text-granite-gray-light mb-1 block">Termos e Condições</label>
                        <textarea name="terms" value={formData.terms} onChange={handleInputChange} rows={3} className="w-full bg-black/30 p-2 rounded border border-granite-gray/50"></textarea>
                    </div>
                </div>

                <div className="flex-shrink-0 p-6 border-t border-granite-gray/20 flex flex-col md:flex-row justify-between items-center gap-4">
                     {/* Discount */}
                    <div className="flex items-center gap-2">
                         <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="bg-black/30 p-2 rounded border border-granite-gray/50">
                            <option value="fixed">Desconto Fixo (R$)</option>
                            <option value="percentage">Desconto (%)</option>
                        </select>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-granite-gray">
                                {formData.discountType === 'fixed' ? <DollarSign size={14} /> : <Percent size={14} />}
                            </span>
                             <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} min="0" className="w-32 bg-black/30 p-2 pl-7 rounded border border-granite-gray/50" />
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="text-right">
                        <div className="text-sm text-granite-gray-light">Subtotal: {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        {discountAmount > 0 && <div className="text-sm text-red-400">Desconto: -{discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                        <div className="text-2xl font-bold text-white">Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                     <div className="flex items-center gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold bg-granite-gray/20 hover:bg-granite-gray/40">Cancelar</button>
                        <button type="submit" className="px-6 py-2 rounded-lg text-sm font-bold bg-cadmium-yellow text-coal-black hover:brightness-110">Salvar Orçamento</button>
                    </div>
                </div>
            </form>
        </div>
        {isServiceModalOpen && (
            <ServiceItemFormModal 
                service={null}
                onClose={() => setIsServiceModalOpen(false)}
                onSave={handleSaveNewService}
            />
        )}
        </>
    );
};