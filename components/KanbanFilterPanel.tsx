import React, { useState, useMemo } from 'react';
import { useAppContext } from './AppContext';
import { Search, X, User, Briefcase, Calendar, Save, Filter, Flag, ChevronDown } from 'lucide-react';
import { KanbanView, Priority } from '../types';

export const KanbanFilterPanel: React.FC = () => {
    const { 
        orders,
        kanbanFilters,
        updateKanbanFilters,
        saveKanbanView,
        customFieldDefinitions
    } = useAppContext();

    const [viewName, setViewName] = useState('');

    const clientList = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.client))).sort()], [orders]);
    const responsibleList = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.responsible).filter(Boolean))).sort()], [orders]);

    const handleFilterChange = (field: string, value: string) => {
        updateKanbanFilters({ [field]: value });
    };

    const handleCustomFieldFilterChange = (fieldId: string, value: any) => {
        updateKanbanFilters({
            customFields: {
                ...kanbanFilters.customFields,
                [fieldId]: value
            }
        });
    };

    const handleSaveView = () => {
        if (viewName.trim()) {
            saveKanbanView(viewName.trim());
            setViewName('');
        }
    };
    
    const clearAllFilters = () => {
        updateKanbanFilters({ searchTerm: '', client: '', responsible: '', startDate: '', endDate: '', priority: undefined, customFields: {} });
    };
    
    const isFilterActive = Object.values(kanbanFilters).some(v => {
        if (typeof v === 'object' && v !== null) {
            return Object.values(v).some(subV => subV);
        }
        return !!v;
    });


    return (
        <div className="bg-black/20 p-3 rounded-lg border border-granite-gray/20 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <input
                        type="text"
                        placeholder="Buscar por OS, cliente..."
                        value={kanbanFilters.searchTerm || ''}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="w-full bg-black/30 border border-granite-gray/50 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-cadmium-yellow"
                    />
                </div>
                 {/* Client */}
                <div className="relative flex-1 min-w-[180px]">
                     <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <select value={kanbanFilters.client || ''} onChange={e => handleFilterChange('client', e.target.value)} className={`w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cadmium-yellow ${kanbanFilters.client ? 'text-gray-200' : 'text-granite-gray-light'}`}>
                        <option value="">Todos os Clientes</option>
                        {clientList.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                     <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-granite-gray pointer-events-none" />
                </div>
                {/* Responsible */}
                <div className="relative flex-1 min-w-[180px]">
                     <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <select value={kanbanFilters.responsible || ''} onChange={e => handleFilterChange('responsible', e.target.value)} className={`w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cadmium-yellow ${kanbanFilters.responsible ? 'text-gray-200' : 'text-granite-gray-light'}`}>
                        <option value="">Todos Responsáveis</option>
                        {responsibleList.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-granite-gray pointer-events-none" />
                </div>
                 {/* Priority */}
                <div className="relative flex-1 min-w-[180px]">
                     <Flag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <select value={kanbanFilters.priority || ''} onChange={e => handleFilterChange('priority', e.target.value)} className={`w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cadmium-yellow ${kanbanFilters.priority ? 'text-gray-200' : 'text-granite-gray-light'}`}>
                        <option value="">Todas as Prioridades</option>
                        <option value="Urgente">Urgente</option>
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-granite-gray pointer-events-none" />
                </div>
                 {/* Custom Fields */}
                {customFieldDefinitions.map(field => {
                    if (field.id === 'cf-3') return null; // Don't show Prazo as a filter here
                    const value = kanbanFilters.customFields?.[field.id];
                    switch (field.type) {
                        case 'text':
                            return (
                                <div key={field.id} className="relative flex-1 min-w-[180px]">
                                    <input
                                        type="text"
                                        placeholder={field.name}
                                        value={value || ''}
                                        onChange={e => handleCustomFieldFilterChange(field.id, e.target.value)}
                                        className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-granite-gray-light focus:outline-none focus:ring-1 focus:ring-cadmium-yellow"
                                    />
                                </div>
                            );
                        case 'boolean':
                             const boolValue = value === undefined || value === '' ? 'all' : String(value);
                            return (
                                 <div key={field.id} className="relative flex-1 min-w-[180px]">
                                    <select value={boolValue} onChange={e => handleCustomFieldFilterChange(field.id, e.target.value === 'all' ? '' : e.target.value === 'true')} className={`w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cadmium-yellow ${value === '' || value === undefined ? 'text-granite-gray-light' : 'text-gray-200'}`}>
                                        <option value="all">{field.name} (Todos)</option>
                                        <option value="true">Sim</option>
                                        <option value="false">Não</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-granite-gray pointer-events-none" />
                                </div>
                            );
                        default:
                            return null;
                    }
                })}

                 {/* Date Range */}
                <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                     <Calendar size={16} className="text-granite-gray flex-shrink-0" />
                    <input type="date" value={kanbanFilters.startDate || ''} onChange={e => handleFilterChange('startDate', e.target.value)} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-1.5 text-sm" />
                    <span className="text-granite-gray">-</span>
                    <input type="date" value={kanbanFilters.endDate || ''} onChange={e => handleFilterChange('endDate', e.target.value)} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-1.5 text-sm" />
                </div>
                {isFilterActive && (
                    <button onClick={clearAllFilters} className="flex items-center text-sm text-yellow-300 hover:text-white">
                        <X size={14} className="mr-1"/>Limpar
                    </button>
                )}
            </div>

             <div className="flex items-center justify-end gap-2 pt-3 border-t border-granite-gray/20">
                <input
                    type="text"
                    placeholder="Nome da visao..."
                    value={viewName}
                    onChange={e => setViewName(e.target.value)}
                    className="w-48 bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-1.5 text-sm placeholder-granite-gray-light"
                />
                <button onClick={handleSaveView} className="flex items-center px-4 py-1.5 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110">
                    <Save size={16} className="mr-2"/>
                    Salvar Visão
                </button>
             </div>
        </div>
    );
};