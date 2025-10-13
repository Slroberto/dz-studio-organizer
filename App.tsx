import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { AddOrderModal } from './components/AddOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { GalleryPage } from './components/GalleryPage';
import { GalleryDetailModal } from './components/GalleryDetailModal';
import { NotificationContainer } from './components/NotificationContainer';
import { ServiceOrder, UserRole, ServiceOrderTemplate } from './types';
import { ActivityLogPage } from './components/ActivityLogPage';
import { DashboardPage } from './components/DashboardPage';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { AgendaPage } from './components/AgendaPage';
import { TemplateModal } from './components/TemplateModal';
import { BottomNavBar } from './components/BottomNavBar';
import { TimelinePage } from './components/TimelinePage';
import { FirestoreOrdersPreview } from './components/FirestoreOrdersPreview';

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

export default function App() {
  // 🔓 LOGIN DESATIVADO TEMPORARIAMENTE
  const currentUser = { name: 'Sandro', role: UserRole.Admin };

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [currentPage, setCurrentPage] = useState('Produção');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<Partial<ServiceOrder> | undefined>(undefined);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [gallerySelectedItem, setGallerySelectedItem] = useState<ServiceOrder | null>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleOpenAddModal = () => {
    setAddModalInitialData(undefined);
    setIsAddModalOpen(true);
  };

  const handleSelectTemplate = (template: ServiceOrderTemplate) => {
    setAddModalInitialData({
      description: template.defaultDescription,
      imageCount: template.defaultImageCount,
      value: template.defaultValue,
    });
    setIsTemplateModalOpen(false);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-coal-black text-white font-sans">
      {!isMobile && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onAddOrderClick={handleOpenAddModal}
          onAddFromTemplateClick={() => setIsTemplateModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6">
          {currentPage === 'Produção' && <KanbanBoard onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Dashboard' && <DashboardPage onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Agenda' && <AgendaPage onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Galeria' && <GalleryPage onSelectOrder={setGallerySelectedItem} />}
          {currentPage === 'Linha do Tempo' && <TimelinePage onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Relatórios' && <ReportsPage />}
          {currentPage === 'Log de Atividade' && <ActivityLogPage />}
          {currentPage === 'Configurações' && <SettingsPage />}
          <FirestoreOrdersPreview />
        </main>
      </div>

      {isTemplateModalOpen && (
        <TemplateModal
          onClose={() => setIsTemplateModalOpen(false)}
          onSelect={handleSelectTemplate}
        />
      )}

      {isAddModalOpen && (
        <AddOrderModal onClose={() => setIsAddModalOpen(false)} initialData={addModalInitialData} />
      )}

      {selectedOrder && (
        <EditOrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {gallerySelectedItem && (
        <GalleryDetailModal order={gallerySelectedItem} onClose={() => setGallerySelectedItem(null)} />
      )}

      <NotificationContainer onNotificationClick={() => {}} />
      {isMobile && <BottomNavBar />}
    </div>
  );
}
