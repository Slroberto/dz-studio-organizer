import React, { useState, lazy, Suspense } from 'react';
import { CommercialQuote, ServiceOrder } from '../types';
import { Loader, Briefcase, Landmark, TrendingUp, FileText, History } from 'lucide-react';

const CommercialDashboardPage = lazy(() => import('./CommercialDashboardPage').then(module => ({ default: module.CommercialDashboardPage })));
const FinancialPage = lazy(() => import('./FinancialPage').then(module => ({ default: module.FinancialPage })));
const ReportsPage = lazy(() => import('./ReportsPage').then(module => ({ default: module.ReportsPage })));
const ActivityLogPage = lazy(() => import('./ActivityLogPage').then(module => ({ default: module.ActivityLogPage })));

interface ManagementPageProps {
    onConvertToOS: (quote: CommercialQuote) => void;
    onSelectOrder: (order: ServiceOrder) => void;
}

type Section = 'comercial' | 'financeiro' | 'analise-reports' | 'analise-log';

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <li
        onClick={onClick}
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors font-semibold ${
            isActive
                ? 'bg-cadmium-yellow/10 text-cadmium-yellow'
                : 'text-gray-300 hover:bg-granite-gray/10'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </li>
);

const SubNavItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
     <li
        onClick={onClick}
        className={`relative pl-4 py-2 text-sm cursor-pointer transition-colors ${
            isActive
                ? 'text-cadmium-yellow font-semibold'
                : 'text-gray-400 hover:text-white'
        }`}
    >
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-granite-gray/30"></span>
        {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-cadmium-yellow"></span>}
        {label}
    </li>
);


export const ManagementPage: React.FC<ManagementPageProps> = ({ onConvertToOS, onSelectOrder }) => {
    const [activeSection, setActiveSection] = useState<Section>('comercial');

    const suspenseFallback = (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="animate-spin text-cadmium-yellow" size={48} />
        </div>
    );
    
    const renderContent = () => {
        switch (activeSection) {
            case 'comercial':
                return <CommercialDashboardPage onConvertToOS={onConvertToOS} />;
            case 'financeiro':
                return <FinancialPage onSelectOrder={onSelectOrder} />;
            case 'analise-reports':
                return <ReportsPage />;
            case 'analise-log':
                return <ActivityLogPage />;
            default:
                return <CommercialDashboardPage onConvertToOS={onConvertToOS} />;
        }
    };

    return (
        <div className="h-full flex -mx-6 -mt-6">
            <aside className="w-64 bg-black/20 border-r border-granite-gray/20 p-4 flex flex-col">
                <h2 className="text-xl font-bold font-display text-white mb-8 pl-2">Gestão do Negócio</h2>
                <nav>
                    <ul className="space-y-2">
                        <NavItem
                            icon={<Briefcase size={20} />}
                            label="Comercial"
                            isActive={activeSection === 'comercial'}
                            onClick={() => setActiveSection('comercial')}
                        />
                        <NavItem
                            icon={<Landmark size={20} />}
                            label="Financeiro"
                            isActive={activeSection === 'financeiro'}
                            onClick={() => setActiveSection('financeiro')}
                        />
                        <div>
                           <div className={`flex items-center p-3 rounded-md font-semibold ${activeSection.startsWith('analise') ? 'text-white' : 'text-gray-300'}`}>
                                <TrendingUp size={20} />
                                <span className="ml-3">Análise</span>
                            </div>
                            <ul className="mt-1 pl-8 space-y-1">
                                <SubNavItem
                                    label="Relatórios"
                                    isActive={activeSection === 'analise-reports'}
                                    onClick={() => setActiveSection('analise-reports')}
                                />
                                <SubNavItem
                                    label="Log de Atividade"
                                    isActive={activeSection === 'analise-log'}
                                    onClick={() => setActiveSection('analise-log')}
                                />
                            </ul>
                        </div>
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto">
                 <Suspense fallback={suspenseFallback}>
                    <div className="p-6">
                        {renderContent()}
                    </div>
                </Suspense>
            </main>
        </div>
    );
};