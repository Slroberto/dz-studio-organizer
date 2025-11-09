import React, { useState, lazy, Suspense } from 'react';
import { CommercialQuote, ServiceOrder } from '../types';
import { Loader, Briefcase, Landmark, TrendingUp } from 'lucide-react';

const CommercialDashboardPage = lazy(() => import('./CommercialDashboardPage').then(module => ({ default: module.CommercialDashboardPage })));
const FinancialPage = lazy(() => import('./FinancialPage').then(module => ({ default: module.FinancialPage })));
const AnalysisPage = lazy(() => import('./AnalysisPage').then(module => ({ default: module.AnalysisPage })));


interface ManagementPageProps {
    onConvertToOS: (quote: CommercialQuote) => void;
    onSelectOrder: (order: ServiceOrder) => void;
}

type ManagementTab = 'comercial' | 'financeiro' | 'analise';

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
            isActive
                ? 'border-b-2 border-cadmium-yellow text-cadmium-yellow'
                : 'text-granite-gray-light border-transparent hover:text-white'
        }`}
    >
        {icon}
        {label}
    </button>
);


export const ManagementPage: React.FC<ManagementPageProps> = ({ onConvertToOS, onSelectOrder }) => {
    const [activeTab, setActiveTab] = useState<ManagementTab>('comercial');

    const suspenseFallback = (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="animate-spin text-cadmium-yellow" size={48} />
        </div>
    );
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-granite-gray/20 -mt-6 -mx-6 px-4 mb-6">
                <TabButton 
                    label="Comercial" 
                    icon={<Briefcase size={16} />} 
                    isActive={activeTab === 'comercial'} 
                    onClick={() => setActiveTab('comercial')} 
                />
                <TabButton 
                    label="Financeiro" 
                    icon={<Landmark size={16} />} 
                    isActive={activeTab === 'financeiro'} 
                    onClick={() => setActiveTab('financeiro')} 
                />
                <TabButton 
                    label="Análise" 
                    icon={<TrendingUp size={16} />} 
                    isActive={activeTab === 'analise'} 
                    onClick={() => setActiveTab('analise')} 
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                 <Suspense fallback={suspenseFallback}>
                    <div className="w-full h-full">
                       {activeTab === 'comercial' && <CommercialDashboardPage onConvertToOS={onConvertToOS} />}
                       {activeTab === 'financeiro' && <FinancialPage onSelectOrder={onSelectOrder} />}
                       {activeTab === 'analise' && <AnalysisPage />}
                    </div>
                </Suspense>
            </div>
        </div>
    );
};