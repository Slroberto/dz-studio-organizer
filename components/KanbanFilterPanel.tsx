import React, { useState, useMemo } from 'react';
import { useAppContext } from './AppContext';
import { Search, X, User, Briefcase, Calendar, Save, Trash2, Filter, Eye } from 'lucide-react';
import { KanbanView } from '../types';

export const KanbanFilterPanel: React.FC = () => {
    const { 
        orders,
        kanbanFilters,
        updateKanbanFilters,
        kanbanViews,
        saveKanbanView,
        applyKanbanView,
        deleteKanbanView
    } = useAppContext();

    const [viewName, setViewName] = useState('');
    const [selectedView, setSelectedView] = useState('default');

    const clientList = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.client))).sort()], [orders]);
    const responsibleList = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.responsible).filter(Boolean))).sort()], [orders]);

    const handleFilterChange = (field: string, value: string) => {
        updateKanbanFilters({ [field]: value });
    };

    const handleSaveView = () => {
        if (viewName.trim()) {
            saveKanbanView(viewName.trim());
            setViewName('');
        }
    };
    
    const handleApplyView = (viewId: string) => {
        setSelectedView(viewId);
        applyKanbanView(viewId);
    };

    const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
        e.stopPropagation();
        deleteKanbanView(viewId);
        if (selectedView === viewId) {
            handleApplyView('default');
        }
    };
    
    const clearAllFilters = () => {
        updateKanbanFilters({ searchTerm: '', client: '', responsible: '', startDate: '', endDate: '' });
        setSelectedView('default');
    };
    
    const isFilterActive = Object.values(kanbanFilters).some(v => v);

    return (
        <div className="bg-black/20 p-3 rounded-lg border border-granite-gray/20 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
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
                <div className="relative">
                     <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <select value={kanbanFilters.client || 'all'} onChange={e => handleFilterChange('client', e.target.value === 'all' ? '' : e.target.value)} className="w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-9 pr-4 py-2 text-sm">
                        {clientList.map(c => <option key={c} value={c}>{c === 'all' ? 'Todos os Clientes' : c}</option>)}
                    </select>
                </div>
                {/* Responsible */}
                <div className="relative">
                     <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <select value={kanbanFilters.responsible || 'all'} onChange={e => handleFilterChange('responsible', e.target.value === 'all' ? '' : e.target.value)} className="w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-9 pr-4 py-2 text-sm">
                        {responsibleList.map(r => <option key={r} value={r}>{r === 'all' ? 'Todos Responsáveis' : r}</option>)}
                    </select>
                </div>
                 {/* Date Range */}
                <div className="flex items-center gap-2">
                     <Calendar size={16} className="text-granite-gray flex-shrink-0" />
                    <input type="date" value={kanbanFilters.startDate || ''} onChange={e => handleFilterChange('startDate', e.target.value)} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-2 text-sm" />
                    <span className="text-granite-gray">-</span>
                    <input type="date" value={kanbanFilters.endDate || ''} onChange={e => handleFilterChange('endDate', e.target.value)} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-2 text-sm" />
                </div>
            </div>
             <div className="flex items-center justify-between border-t border-granite-gray/20 pt-3">
                 <div className="flex items-center gap-2">
                    <Eye size={16} className="text-granite-gray"/>
                    <select value={selectedView} onChange={e => handleApplyView(e.target.value)} className="bg-black/30 border border-granite-gray/50 rounded-lg pl-2 pr-8 py-1.5 text-sm appearance-none">
                        <option value="default">Visão Padrão</option>
                        {kanbanViews.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                    {selectedView !== 'default' && (
                        <button onClick={(e) => handleDeleteView(e, selectedView)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    )}
                 </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Nome da visão..."
                        value={viewName}
                        onChange={e => setViewName(e.target.value)}
                        className="w-40 bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <button onClick={handleSaveView} className="flex items-center px-3 py-1.5 bg-cadmium-yellow/80 rounded-lg text-xs font-bold text-coal-black hover:bg-cadmium-yellow"><Save size={14} className="mr-1.5"/>Salvar Visão</button>
                    {isFilterActive && (
                        <button onClick={clearAllFilters} className="flex items-center text-sm text-yellow-300 hover:text-white"><X size={14} className="mr-1"/>Limpar</button>
                    )}
                </div>
             </div>
        </div>
    );
};