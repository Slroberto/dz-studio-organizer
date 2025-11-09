import React, { useState, useMemo } from 'react';
import { useAppContext } from './AppContext';
import { Opportunity, OpportunityStatus, CommercialQuote } from '../types';
import { PlusCircle, Edit, Trash2, ArrowRightCircle, DollarSign, Calendar, Link as LinkIcon, Briefcase, X, Loader, Lightbulb, GanttChartSquare, View, Bot, FileSignature, UserCheck } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { TriageView } from './TriageView';

const statusConfig: Record<OpportunityStatus, { color: string, label: string, borderColor: string }> = {
    [OpportunityStatus.Prospecting]: { color: 'bg-blue-500/20 text-blue-300', label: 'Prospecção', borderColor: 'border-blue-500' },
    [OpportunityStatus.ForAnalysis]: { color: 'bg-yellow-500/20 text-yellow-300', label: 'Para Análise', borderColor: 'border-yellow-500' },
    [OpportunityStatus.Contacted]: { color: 'bg-purple-500/20 text-purple-300', label: 'Contatado', borderColor: 'border-purple-500' },
    [OpportunityStatus.Negotiating]: { color: 'bg-orange-500/20 text-orange-300', label: 'Negociando', borderColor: 'border-orange-500' },
    [OpportunityStatus.Won]: { color: 'bg-green-500/20 text-green-300', label: 'Ganho', borderColor: 'border-green-500' },
    [OpportunityStatus.Lost]: { color: 'bg-red-500/20 text-red-300', label: 'Perdido', borderColor: 'border-red-500' },
};

const AddOpportunityModal: React.FC<{
    opportunity: Opportunity | null;
    onClose: () => void;
    onSave: (opportunity: Opportunity) => void;
}> = ({ opportunity, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Opportunity, 'id'>>({
        title: opportunity?.title || '',
        clientOrSource: opportunity?.clientOrSource || '',
        budget: opportunity?.budget || undefined,
        deadline: opportunity?.deadline?.split('T')[0] || '',
        link: opportunity?.link || '',
        description: opportunity?.description || '',
        status: opportunity?.status || OpportunityStatus.Prospecting,
        lossReason: opportunity?.lossReason || undefined,
        lossNotes: opportunity?.lossNotes || '',
        imageUrl: opportunity?.imageUrl || '',
    });
    const { isDataLoading } = useAppContext();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalData: Opportunity = {
            id: opportunity?.id || `opp-${Date.now()}`,
            ...formData,
            deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        };
        await onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 modal-backdrop-animation" onClick={onClose}>
            <div className="bg-coal-black rounded-xl p-6 w-full max-w-lg border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 font-display">{opportunity ? 'Editar' : 'Nova'} Oportunidade</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Título do Trabalho" required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                    <input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="URL da Imagem de Capa" className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Descrição curta do trabalho..." rows={3} className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="clientOrSource" value={formData.clientOrSource} onChange={handleInputChange} placeholder="Cliente / Fonte (ex: Workana)" required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                        <input name="link" value={formData.link} onChange={handleInputChange} placeholder="Link da Vaga" className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                        <input name="budget" type="number" step="0.01" value={formData.budget || ''} onChange={handleInputChange} placeholder="Orçamento (R$)" className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                        <input name="deadline" type="date" value={formData.deadline} onChange={handleInputChange} className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-granite-gray-light mb-1 block">Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-black/30 p-2 rounded border border-granite-gray/50">
                            {Object.values(OpportunityStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {formData.status === OpportunityStatus.Lost && (
                        <div className="p-3 bg-red-900/20 rounded-lg space-y-3 card-enter-animation">
                             <label className="text-sm font-medium text-red-200 mb-1 block">Detalhes da Perda</label>
                             <select name="lossReason" value={formData.lossReason || ''} onChange={handleInputChange} className="w-full bg-black/30 p-2 rounded border border-red-500/50">
                                <option value="">Selecione o motivo...</option>
                                <option value="Preço">Preço</option>
                                <option value="Prazo">Prazo</option>
                                <option value="Concorrência">Concorrência</option>
                                <option value="Escopo">Escopo</option>
                                <option value="Outro">Outro</option>
                            </select>
                            <textarea name="lossNotes" value={formData.lossNotes} onChange={handleInputChange} placeholder="Notas adicionais sobre a perda (opcional)..." rows={2} className="w-full bg-black/30 p-2 rounded border border-red-500/50" />
                        </div>
                    )}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-granite-gray/20">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold bg-granite-gray/20 hover:bg-granite-gray/40">Cancelar</button>
                        <button type="submit" disabled={isDataLoading} className="px-6 py-2 rounded-lg text-sm font-bold bg-cadmium-yellow text-coal-black hover:brightness-110 disabled:opacity-50">{isDataLoading ? <Loader size={18} className="animate-spin"/> : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OpportunityCard: React.FC<{
    opportunity: Opportunity;
    onEdit: () => void;
    onDelete: () => void;
    onConvertToOS: () => void;
    onOpenQuoteEditor: (quote: Partial<CommercialQuote> | null) => void;
}> = ({ opportunity, onEdit, onDelete, onConvertToOS, onOpenQuoteEditor }) => {
    const { analysisLoading, analyzeOpportunity, analyzeClientProfile, generateProposal } = useAppContext();

    return (
        <div className="relative group bg-coal-black rounded-lg border border-granite-gray/20 flex flex-col card-enter-animation mb-3 overflow-hidden">
            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={onEdit} title="Editar" className="p-1.5 bg-coal-black/50 rounded-full text-gray-300 hover:text-cadmium-yellow hover:bg-black/80"><Edit size={14} /></button>
                <button onClick={onDelete} title="Excluir" className="p-1.5 bg-coal-black/50 rounded-full text-gray-300 hover:text-red-500 hover:bg-black/80"><Trash2 size={14} /></button>
            </div>
             {opportunity.imageUrl && (
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${opportunity.imageUrl})` }}></div>
            )}
            <div className="p-4 flex flex-col flex-grow justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg text-white">{opportunity.title}</h3>
                    <p className="text-sm text-gray-300 mt-1 leading-relaxed">{opportunity.description}</p>
                    
                    <div className="mt-3 pt-3 border-t border-granite-gray/20 space-y-2 text-sm text-gray-300">
                        <div className="flex items-center gap-2"><Briefcase size={14} className="text-granite-gray-light"/> <strong>Fonte:</strong> {opportunity.clientOrSource}</div>
                        {opportunity.budget && <div className="flex items-center gap-2"><DollarSign size={14} className="text-granite-gray-light"/> <strong>Orçamento:</strong> {opportunity.budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                        {opportunity.deadline && <div className="flex items-center gap-2"><Calendar size={14} className="text-granite-gray-light"/> <strong>Prazo:</strong> {new Date(opportunity.deadline).toLocaleDateString('pt-BR')}</div>}
                        {opportunity.link && <div className="flex items-center gap-2"><LinkIcon size={14} className="text-granite-gray-light"/> <a href={opportunity.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">Ver vaga original</a></div>}
                    </div>
                </div>

                <div className="mt-2 space-y-2">
                    {/* AI Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); analyzeOpportunity(opportunity.id); }}
                            disabled={!!analysisLoading[opportunity.id]}
                            className="flex items-center justify-center gap-2 px-2 py-1.5 bg-blue-500/10 text-blue-300 text-xs font-semibold rounded hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {analysisLoading[opportunity.id] === 'opportunity' ? <Loader size={14} className="animate-spin" /> : <Bot size={14} />}
                            Analisar Vaga
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); analyzeClientProfile(opportunity.id); }}
                            disabled={!!analysisLoading[opportunity.id]}
                            className="flex items-center justify-center gap-2 px-2 py-1.5 bg-purple-500/10 text-purple-300 text-xs font-semibold rounded hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {analysisLoading[opportunity.id] === 'client' ? <Loader size={14} className="animate-spin" /> : <UserCheck size={14} />}
                            Analisar Perfil
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); generateProposal(opportunity.id); }}
                            disabled={!!analysisLoading[opportunity.id]}
                            className="flex items-center justify-center gap-2 px-2 py-1.5 bg-green-500/10 text-green-300 text-xs font-semibold rounded hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {analysisLoading[opportunity.id] === 'proposal' ? <Loader size={14} className="animate-spin" /> : <FileSignature size={14} />}
                            Gerar Rascunho
                        </button>
                    </div>

                    {/* AI Analysis Display */}
                    {opportunity.aiAnalysis && (
                        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-blue-500/20 card-enter-animation">
                            <h4 className="font-bold text-blue-300 flex items-center gap-2 mb-2"><Bot size={16} /> Análise da Vaga (IA)</h4>
                            <div className="text-sm text-gray-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: opportunity.aiAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                        </div>
                    )}
                    {opportunity.clientProfileAnalysis && (
                        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-purple-500/20 card-enter-animation">
                            <h4 className="font-bold text-purple-300 flex items-center gap-2 mb-2"><UserCheck size={16} /> Análise do Perfil (IA)</h4>
                            <div className="text-sm text-gray-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: opportunity.clientProfileAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                        </div>
                    )}
                </div>

                <div>
                    {opportunity.status === OpportunityStatus.Won && (
                        <button onClick={onConvertToOS} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110 transform active:scale-95 transition-all">
                            <ArrowRightCircle size={18} />
                            Converter em OS
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const OpportunityColumn: React.FC<{
    title: string;
    status: OpportunityStatus;
    opportunities: Opportunity[];
    onEdit: (opportunity: Opportunity) => void;
    onDelete: (opportunity: Opportunity) => void;
    onConvertToOS: (opportunity: Opportunity) => void;
    onOpenQuoteEditor: (quote: Partial<CommercialQuote> | null) => void;
}> = ({ title, status, opportunities, onEdit, onDelete, onConvertToOS, onOpenQuoteEditor }) => {
    return (
        <div className="flex flex-col w-[90vw] md:w-80 flex-shrink-0 h-full rounded-xl bg-black/20">
            <div className={`p-4 border-b-2 border-granite-gray/20 flex items-center justify-between border-t-4 rounded-t-xl`} style={{ borderTopColor: statusConfig[status].borderColor }}>
                <h2 className="font-bold text-gray-300">{title}</h2>
                <span className="text-sm font-semibold bg-gray-700 text-gray-300 rounded-full px-2 py-1">{opportunities.length}</span>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
                {opportunities.map(opp => (
                    <OpportunityCard
                        key={opp.id}
                        opportunity={opp}
                        onEdit={() => onEdit(opp)}
                        onDelete={() => onDelete(opp)}
                        onConvertToOS={() => onConvertToOS(opp)}
                        onOpenQuoteEditor={onOpenQuoteEditor}
                    />
                ))}
            </div>
        </div>
    );
};

const KanbanView: React.FC<{ 
    onConvertToOS: (opportunity: Opportunity) => void;
    onOpenQuoteEditor: (quote: Partial<CommercialQuote> | null) => void;
}> = ({ onConvertToOS, onOpenQuoteEditor }) => {
    const { opportunities, updateOpportunity, deleteOpportunity } = useAppContext();
    const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
    const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

     const opportunityColumns = useMemo(() => [
        { title: 'Prospecção', status: OpportunityStatus.Prospecting },
        { title: 'Para Análise', status: OpportunityStatus.ForAnalysis },
        { title: 'Contatado', status: OpportunityStatus.Contacted },
        { title: 'Negociando', status: OpportunityStatus.Negotiating },
        { title: 'Ganho', status: OpportunityStatus.Won },
        { title: 'Perdido', status: OpportunityStatus.Lost },
    ], []);

    const opportunitiesByStatus = useMemo(() => {
        const grouped = {} as Record<OpportunityStatus, Opportunity[]>;
        for (const status of Object.values(OpportunityStatus)) {
            grouped[status] = [];
        }
        opportunities.forEach(opp => {
            if (grouped[opp.status]) {
                grouped[opp.status].push(opp);
            }
        });
        return grouped;
    }, [opportunities]);

    const handleOpenModal = (opportunity: Opportunity | null) => {
        setOpportunityToEdit(opportunity);
        setIsModalOpen(true);
    };

    const handleSave = async (opportunity: Opportunity) => {
        if (opportunityToEdit) {
            await updateOpportunity(opportunity);
        } else {
            // This case should be handled by the main page button
        }
        setIsModalOpen(false);
        setOpportunityToEdit(null);
    };
    
    const handleDelete = async () => {
        if (opportunityToDelete) {
            await deleteOpportunity(opportunityToDelete.id);
            setOpportunityToDelete(null);
        }
    };
    
    return (
        <div className="relative flex-1 -mx-6 min-h-0">
            {opportunities.length > 0 ? (
                <div className="kanban-container flex space-x-6 h-full px-6">
                    {opportunityColumns.map(column => (
                        <OpportunityColumn
                            key={column.status}
                            title={column.title}
                            status={column.status}
                            opportunities={opportunitiesByStatus[column.status] || []}
                            onEdit={handleOpenModal}
                            onDelete={(opp) => setOpportunityToDelete(opp)}
                            onConvertToOS={onConvertToOS}
                            onOpenQuoteEditor={onOpenQuoteEditor}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-granite-gray">
                    <Lightbulb size={48} className="mb-4" />
                    <h2 className="text-xl font-bold text-gray-400">Nenhuma oportunidade cadastrada</h2>
                    <p className="mt-2">Clique em "Nova Oportunidade" para começar a prospectar.</p>
                </div>
            )}
            
            {isModalOpen && (
                <AddOpportunityModal
                    opportunity={opportunityToEdit}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            {opportunityToDelete && (
                <ConfirmDeleteModal
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a oportunidade "<strong>${opportunityToDelete.title}</strong>"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setOpportunityToDelete(null)}
                />
            )}
        </div>
    );
};

interface OpportunitiesPageProps {
    onConvertToOS: (opportunity: Opportunity) => void;
    onOpenQuoteEditor: (quote: Partial<CommercialQuote> | null) => void;
}


export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ onConvertToOS, onOpenQuoteEditor }) => {
    const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity, searchSources, findNewOpportunities, isSearchingOpportunities } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
    const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
    const [viewMode, setViewMode] = useState<'kanban' | 'triage'>('kanban');

    const opportunitiesForTriage = useMemo(() => opportunities.filter(o => o.status === OpportunityStatus.Prospecting), [opportunities]);

    const handleOpenModal = (opportunity: Opportunity | null) => {
        setOpportunityToEdit(opportunity);
        setIsModalOpen(true);
    };

    const handleSave = async (opportunity: Opportunity) => {
        if (opportunityToEdit) {
            await updateOpportunity(opportunity);
        } else {
            const { id, ...newOppData } = opportunity;
            await addOpportunity(newOppData);
        }
        setIsModalOpen(false);
        setOpportunityToEdit(null);
    };
    
    const handleDelete = async () => {
        if (opportunityToDelete) {
            await deleteOpportunity(opportunityToDelete.id);
            setOpportunityToDelete(null);
        }
    };
    
    const hasEnabledSources = useMemo(() => searchSources.some(s => s.enabled), [searchSources]);

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-2 p-1 bg-black/30 rounded-lg">
                     <button 
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-granite-gray/20 text-white' : 'text-granite-gray-light hover:text-white'}`}
                    >
                        <GanttChartSquare size={16} />
                        Kanban
                    </button>
                    <button 
                        onClick={() => setViewMode('triage')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'triage' ? 'bg-granite-gray/20 text-white' : 'text-granite-gray-light hover:text-white'}`}
                        disabled={opportunitiesForTriage.length === 0}
                    >
                        <View size={16} />
                        Triagem Rápida
                        {opportunitiesForTriage.length > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cadmium-yellow text-coal-black">{opportunitiesForTriage.length}</span>
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={findNewOpportunities} 
                        disabled={isSearchingOpportunities || !hasEnabledSources}
                        title={!hasEnabledSources ? "Nenhuma fonte de busca ativa. Configure em Configurações > Integrações." : "Buscar novas oportunidades nas fontes ativas."}
                        className="flex items-center justify-center px-4 py-2 bg-blue-500/80 text-white font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-48"
                    >
                        {isSearchingOpportunities ? <Loader size={18} className="animate-spin mr-2" /> : <Briefcase size={18} className="mr-2" />}
                        {isSearchingOpportunities ? 'Buscando...' : 'Buscar Vagas'}
                    </button>
                    <button onClick={() => handleOpenModal(null)} className="flex items-center justify-center px-4 py-2 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110">
                        <PlusCircle size={18} className="mr-2" />
                        Nova Oportunidade
                    </button>
                </div>
            </div>
            
            {viewMode === 'kanban' ? (
                <KanbanView onConvertToOS={onConvertToOS} onOpenQuoteEditor={onOpenQuoteEditor} />
            ) : (
                <TriageView 
                    opportunities={opportunitiesForTriage}
                    onUpdateStatus={(oppId, newStatus) => {
                        const opp = opportunities.find(o => o.id === oppId);
                        if (opp) {
                            updateOpportunity({ ...opp, status: newStatus });
                        }
                    }}
                    onOpenQuoteEditor={onOpenQuoteEditor}
                />
            )}

            {isModalOpen && (
                <AddOpportunityModal
                    opportunity={opportunityToEdit}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            {opportunityToDelete && (
                <ConfirmDeleteModal
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a oportunidade "<strong>${opportunityToDelete.title}</strong>"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setOpportunityToDelete(null)}
                />
            )}
        </div>
    );
};