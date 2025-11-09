import React, { useState, useMemo, useEffect } from 'react';
// FIX: Removed incorrect import of 'Partial'. It is a built-in TypeScript utility type.
import { Opportunity, OpportunityStatus, CommercialQuote } from '../types';
import { Briefcase, DollarSign, Calendar, Link as LinkIcon, XCircle, Clock, CheckCircle, Lightbulb, Bot, Loader, FileSignature, UserCheck } from 'lucide-react';
import { useAppContext } from './AppContext';

interface TriageViewProps {
    opportunities: Opportunity[];
    onUpdateStatus: (opportunityId: string, newStatus: OpportunityStatus) => void;
    onOpenQuoteEditor: (quote: Partial<CommercialQuote> | null) => void;
}

const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    colorClasses: string;
    onClick: () => void;
}> = ({ icon, label, colorClasses, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg text-white font-bold transition-all duration-200 transform hover:scale-105 ${colorClasses}`}
    >
        {icon}
        <span className="mt-2">{label}</span>
    </button>
);

export const TriageView: React.FC<TriageViewProps> = ({ opportunities, onUpdateStatus, onOpenQuoteEditor }) => {
    const { analyzeOpportunity, analyzingOpportunityId, generateProposalForOpportunity, isGeneratingProposalId, analyzeClientProfile, analyzingProfileId } = useAppContext();
    const [totalCount, setTotalCount] = useState(opportunities.length);
    const [animationClass, setAnimationClass] = useState('animate-fadeIn');

    useEffect(() => {
        // This effect runs once when the component mounts with a non-empty list
        // to set the initial total for the progress counter.
        if (opportunities.length > 0) {
            setTotalCount(opportunities.length);
        }
    }, []); // Empty dependency array ensures it runs only once on mount

     // When the list of opportunities changes, reset the total count.
    useEffect(() => {
        setTotalCount(opportunities.length);
    }, [opportunities.length > 0]);


    const currentOpportunity = opportunities[0];
    const currentIndex = totalCount - opportunities.length;
    const isAnalyzing = analyzingOpportunityId === currentOpportunity?.id;
    const isGenerating = isGeneratingProposalId === currentOpportunity?.id;
    const isAnalyzingProfile = analyzingProfileId === currentOpportunity?.id;

    const handleGenerateDraft = async () => {
        if (!currentOpportunity) return;
        const draft = await generateProposalForOpportunity(currentOpportunity.id);
        if (draft) {
            onOpenQuoteEditor(draft);
        }
    };


    const handleAction = (newStatus: OpportunityStatus) => {
        if (!currentOpportunity) return;

        setAnimationClass('animate-fadeOut'); // Use a custom fade-out animation if defined, otherwise it just disappears

        // After the animation, update the status and reset for the next card
        setTimeout(() => {
            onUpdateStatus(currentOpportunity.id, newStatus);
            setAnimationClass('animate-fadeIn'); // Prepare for the next card
        }, 300); // Duration should match the fade-out animation
    };

    if (!currentOpportunity) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-granite-gray animate-fadeIn">
                <Lightbulb size={64} className="mb-4 text-green-400" />
                <h2 className="text-2xl font-bold text-gray-300">Tudo em ordem!</h2>
                <p className="mt-2 max-w-sm">Nenhuma nova oportunidade para triagem. Use o botão "Buscar Vagas" para encontrar mais.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center h-full ${animationClass}`}>
            <div className="absolute top-4 right-4 text-sm font-semibold text-granite-gray-light">
                {currentIndex + 1} de {totalCount}
            </div>

            {/* Main Opportunity Card */}
            <div className="w-full max-w-2xl bg-coal-black rounded-xl border border-granite-gray/20 shadow-2xl overflow-hidden flex flex-col">
                {currentOpportunity.imageUrl && (
                    <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${currentOpportunity.imageUrl})` }}></div>
                )}
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{currentOpportunity.title}</h2>
                    <p className="text-gray-300 leading-relaxed mb-6">{currentOpportunity.description}</p>
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-300 border-t border-granite-gray/20 pt-6">
                        <div className="flex items-center gap-3"><Briefcase size={16} className="text-granite-gray-light"/> <strong>Fonte:</strong> {currentOpportunity.clientOrSource}</div>
                        {currentOpportunity.budget != null && <div className="flex items-center gap-3"><DollarSign size={16} className="text-granite-gray-light"/> <strong>Orçamento:</strong> {currentOpportunity.budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                        {currentOpportunity.deadline && <div className="flex items-center gap-3"><Calendar size={16} className="text-granite-gray-light"/> <strong>Prazo:</strong> {new Date(currentOpportunity.deadline).toLocaleDateString('pt-BR')}</div>}
                        {currentOpportunity.link && <div className="flex items-center gap-3"><LinkIcon size={16} className="text-granite-gray-light"/> <a href={currentOpportunity.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">Ver vaga original</a></div>}
                    </div>
                    
                    {currentOpportunity.aiAnalysis && (
                        <div className="mt-6 p-4 bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg space-y-2">
                            <h4 className="font-bold text-blue-300 flex items-center gap-2"><Bot size={16}/> Análise da Oportunidade</h4>
                            <p className="text-sm text-gray-300"><strong>Resumo:</strong> {currentOpportunity.aiAnalysis.summary}</p>
                            <p className="text-sm text-gray-300"><strong>Complexidade:</strong> {currentOpportunity.aiAnalysis.complexity}</p>
                            <p className="text-sm text-gray-300"><strong>Orçamento:</strong> {currentOpportunity.aiAnalysis.budgetAnalysis}</p>
                        </div>
                    )}

                    {currentOpportunity.clientProfileAnalysis && (
                         <div className="mt-2 p-4 bg-purple-900/20 border-l-4 border-purple-500 rounded-r-lg space-y-2">
                            <h4 className="font-bold text-purple-300 flex items-center gap-2"><UserCheck size={16}/> Análise de Perfil</h4>
                            <p className="text-sm text-gray-300"><strong>Tom:</strong> {currentOpportunity.clientProfileAnalysis.tone}</p>
                            <p className="text-sm text-gray-300"><strong>Clareza:</strong> {currentOpportunity.clientProfileAnalysis.clarity}</p>
                            {currentOpportunity.clientProfileAnalysis.redFlags.length > 0 && (
                                <div>
                                    <strong className="text-sm text-gray-300">Sinais de Alerta:</strong>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {currentOpportunity.clientProfileAnalysis.redFlags.map((flag, i) => (
                                            <span key={i} className="text-xs font-semibold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{flag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                         <button
                            onClick={() => analyzeOpportunity(currentOpportunity.id)}
                            disabled={isAnalyzing || !!currentOpportunity.aiAnalysis}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/80 text-white font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isAnalyzing ? <Loader size={20} className="animate-spin" /> : <Bot size={20} />}
                            {isAnalyzing ? 'Analisando...' : 'Analisar Vaga'}
                        </button>
                        <button
                            onClick={() => analyzeClientProfile(currentOpportunity.id)}
                            disabled={isAnalyzingProfile || !!currentOpportunity.clientProfileAnalysis}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/80 text-white font-bold rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isAnalyzingProfile ? <Loader size={20} className="animate-spin" /> : <UserCheck size={20} />}
                            {isAnalyzingProfile ? 'Analisando...' : 'Analisar Perfil'}
                        </button>
                    </div>

                    <button 
                        onClick={handleGenerateDraft}
                        disabled={isGenerating}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-green-600/80 text-white font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-wait transition-all"
                    >
                        {isGenerating ? <Loader size={20} className="animate-spin" /> : <FileSignature size={20} />}
                        {isGenerating ? 'Gerando...' : 'Gerar Rascunho com IA'}
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-2xl mt-6 grid grid-cols-3 gap-4">
                <ActionButton
                    icon={<XCircle size={28} />}
                    label="Descartar"
                    colorClasses="bg-red-500/80 hover:bg-red-500"
                    onClick={() => handleAction(OpportunityStatus.Lost)}
                />
                <ActionButton
                    icon={<Clock size={28} />}
                    label="Analisar Depois"
                    colorClasses="bg-yellow-500/80 hover:bg-yellow-500"
                    onClick={() => handleAction(OpportunityStatus.ForAnalysis)}
                />
                <ActionButton
                    icon={<CheckCircle size={28} />}
                    label="Iniciar Contato"
                    colorClasses="bg-green-500/80 hover:bg-green-500"
                    onClick={() => handleAction(OpportunityStatus.Contacted)}
                />
            </div>
        </div>
    );
};