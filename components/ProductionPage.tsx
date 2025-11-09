import React, { useState, lazy, Suspense } from 'react';
import { ServiceOrder } from '../types';
import { Loader, GanttChartSquare, CalendarClock, CalendarRange, GalleryHorizontal } from 'lucide-react';

const KanbanBoard = lazy(() => import('./KanbanBoard').then(module => ({ default: module.KanbanBoard })));
const AgendaPage = lazy(() => import('./AgendaPage').then(module => ({ default: module.AgendaPage })));
const TimelinePage = lazy(() => import('./TimelinePage').then(module => ({ default: module.TimelinePage })));
const GalleryPage = lazy(() => import('./GalleryPage').then(module => ({ default: module.GalleryPage })));

interface ProductionPageProps {
    onSelectOrder: (order: ServiceOrder) => void;
    onSelectGalleryItem: (order: ServiceOrder) => void;
    onEditRequest: (order: ServiceOrder) => void;
    onDeleteRequest: (order: ServiceOrder) => void;
}

type ProductionTab = 'kanban' | 'agenda' | 'timeline' | 'galeria';

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

export const ProductionPage: React.FC<ProductionPageProps> = ({ onSelectOrder, onSelectGalleryItem, onEditRequest, onDeleteRequest }) => {
    const [activeTab, setActiveTab] = useState<ProductionTab>('kanban');

    const suspenseFallback = (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="animate-spin text-cadmium-yellow" size={48} />
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-granite-gray/20 -mt-4 -mx-6 px-4 mb-4">
                <TabButton label="Kanban" icon={<GanttChartSquare size={16} />} isActive={activeTab === 'kanban'} onClick={() => setActiveTab('kanban')} />
                <TabButton label="Agenda" icon={<CalendarClock size={16} />} isActive={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} />
                <TabButton label="Linha do Tempo" icon={<CalendarRange size={16} />} isActive={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} />
                <TabButton label="Galeria (Entregues)" icon={<GalleryHorizontal size={16} />} isActive={activeTab === 'galeria'} onClick={() => setActiveTab('galeria')} />
            </div>

            <div className="flex-1 overflow-y-auto -mx-6 px-6">
                <Suspense fallback={suspenseFallback}>
                    {activeTab === 'kanban' && <KanbanBoard onSelectOrder={onSelectOrder} onEditRequest={onEditRequest} onDeleteRequest={onDeleteRequest} />}
                    {activeTab === 'agenda' && <AgendaPage onSelectOrder={onSelectOrder} />}
                    {activeTab === 'timeline' && <TimelinePage onSelectOrder={onSelectOrder} />}
                    {activeTab === 'galeria' && <GalleryPage onSelectOrder={onSelectGalleryItem} />}
                </Suspense>
            </div>
        </div>
    );
};