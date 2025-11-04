import React, { useState, useEffect } from 'react';
import { FixedCost, VariableCost, RevenueEntry, FinancialCategory } from '../types';
import { useAppContext } from './AppContext';
import { FINANCIAL_CATEGORIES } from '../constants';

type EntryType = FixedCost | VariableCost | RevenueEntry;

interface FinancialEntryModalProps {
  type: 'fixed' | 'variable' | 'revenue';
  entry: EntryType | null;
  onClose: () => void;
  onSave: (entry: Partial<EntryType>) => void;
}

export const FinancialEntryModal: React.FC<FinancialEntryModalProps> = ({ type, entry, onClose, onSave }) => {
    const { orders } = useAppContext();
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (entry) {
            setFormData(entry);
        } else {
            const defaultDate = new Date().toISOString().split('T')[0];
            const defaultCategory = FINANCIAL_CATEGORIES[0];
            setFormData({
                date: defaultDate,
                category: defaultCategory,
                value: 0
            });
        }
    }, [entry, type]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type: inputType } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: inputType === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const title = entry 
        ? `Editar ${type === 'fixed' ? 'Custo Fixo' : type === 'variable' ? 'Custo Variável' : 'Receita'}`
        : `Adicionar ${type === 'fixed' ? 'Custo Fixo' : type === 'variable' ? 'Custo Variável' : 'Receita'}`;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 modal-backdrop-animation" onClick={onClose}>
            <div className="bg-coal-black rounded-xl p-6 w-full max-w-md border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 font-display">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-granite-gray-light mb-1">
                            {type === 'fixed' ? 'Nome do Custo' : 'Descrição'}
                        </label>
                        <input
                            name={type === 'fixed' ? 'name' : 'description'}
                            value={formData.name || formData.description || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-black/30 p-2 rounded border border-granite-gray/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-granite-gray-light mb-1">Valor (R$)</label>
                        <input
                            name="value"
                            type="number"
                            step="0.01"
                            value={formData.value || 0}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-black/30 p-2 rounded border border-granite-gray/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-granite-gray-light mb-1">Categoria</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-black/30 p-2 rounded border border-granite-gray/50"
                        >
                            {FINANCIAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    {type !== 'fixed' && (
                        <div>
                             <label className="block text-sm font-medium text-granite-gray-light mb-1">Data</label>
                             <input
                                name="date"
                                type="date"
                                value={(formData.date || '').split('T')[0]}
                                onChange={handleInputChange}
                                required
                                className="w-full bg-black/30 p-2 rounded border border-granite-gray/50"
                            />
                        </div>
                    )}
                    
                    {(type === 'variable' || type === 'revenue') && (
                        <div>
                            <label className="block text-sm font-medium text-granite-gray-light mb-1">Vincular a OS (Opcional)</label>
                            <select
                                name="orderId"
                                value={formData.orderId || ''}
                                onChange={handleInputChange}
                                className="w-full bg-black/30 p-2 rounded border border-granite-gray/50"
                            >
                                <option value="">Nenhuma</option>
                                {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.client}</option>)}
                            </select>
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold bg-granite-gray/20 hover:bg-granite-gray/40">Cancelar</button>
                        <button type="submit" className="px-6 py-2 rounded-lg text-sm font-bold bg-cadmium-yellow text-coal-black hover:brightness-110">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
