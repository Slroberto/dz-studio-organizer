
import React, { useState, lazy, Suspense } from 'react';
import { Loader, FileText, History } from 'lucide-react';

const ReportsPage = lazy(() => import('./ReportsPage').then(module => ({ default: module.ReportsPage })));
const ActivityLogPage = lazy(() => import('./ActivityLogPage').then(module => ({ default: module.ActivityLogPage })));

type AnalysisTab = 'reports' | 'log';

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

export const AnalysisPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AnalysisTab>('reports');

    const suspenseFallback = (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="animate-spin text-cadmium-yellow" size={48} />
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-granite-gray/20 -mt-4 -mx-6 px-4 mb-4">
                <TabButton label="Relatórios" icon={<FileText size={16} />} isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                <TabButton label="Log de Atividade" icon={<History size={16} />} isActive={activeTab === 'log'} onClick={() => setActiveTab('log')} />
            </div>

            <div className="flex-1 overflow-y-auto">
                <Suspense fallback={suspenseFallback}>
                    {activeTab === 'reports' && <ReportsPage />}
                    {activeTab === 'log' && <ActivityLogPage />}
                </Suspense>
            </div>
        </div>
    );
};
