
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header, HeaderRef } from './components/Header';
import { AddOrderModal } from './components/AddOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { GalleryDetailModal } from './components/GalleryDetailModal';
import { NotificationContainer } from './components/NotificationContainer';
import { DailySummaryModal } from './components/DailySummaryModal';
import { ServiceOrder, UserRole, ServiceOrderTemplate, CommercialQuote } from './types';
import { LoginPage } from './components/LoginPage';
import { TemplateModal } from './components/TemplateModal';
import { useAppContext } from './components/AppContext';
import { Loader } from 'lucide-react';
import { BottomNavBar } from './components/BottomNavBar';
import { ClientPortalPage } from './components/ClientPortalPage';
import { OrderDetailPanel } from './components/OrderDetailPanel';

// Lazy load page components for better performance
const DashboardPage = lazy(() => import('./components/DashboardPage').then(module => ({ default: module.DashboardPage })));
const KanbanBoard = lazy(() => import('./components/KanbanBoard').then(module => ({ default: module.KanbanBoard })));
const CommercialDashboardPage = lazy(() => import('./components/CommercialDashboardPage').then(module => ({ default: module.CommercialDashboardPage })));
const AgendaPage = lazy(() => import('./components/AgendaPage').then(module => ({ default: module.AgendaPage })));
const GalleryPage = lazy(() => import('./components/GalleryPage').then(module => ({ default: module.GalleryPage })));
const TimelinePage = lazy(() => import('./components/TimelinePage').then(module => ({ default: module.TimelinePage })));
const FinancialPage = lazy(() => import('./components/FinancialPage').then(module => ({ default: module.FinancialPage })));
const ChatPage = lazy(() => import('./components/ChatPage').then(module => ({ default: module.ChatPage })));
const ReportsPage = lazy(() => import('./components/ReportsPage').then(module => ({ default: module.ReportsPage })));
const ActivityLogPage = lazy(() => import('./components/ActivityLogPage').then(module => ({ default: module.ActivityLogPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(module => ({ default: module.SettingsPage })));


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
  const {
    currentUser,
    orders,
    currentPage,
    isDataLoading,
  } = useAppContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<Partial<ServiceOrder> | undefined>(undefined);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // State for Detail Panel (Quick View) and Edit Modal (Full Editor)
  const [detailPanelOrder, setDetailPanelOrder] = useState<ServiceOrder | null>(null);
  const [editModalOrder, setEditModalOrder] = useState<ServiceOrder | null>(null);
  
  const [gallerySelectedItem, setGallerySelectedItem] = useState<ServiceOrder | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const headerRef = useRef<HeaderRef>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Client Portal Routing
  const path = window.location.pathname;
  if (path.startsWith('/portal/')) {
    const token = path.split('/')[2];
    return <ClientPortalPage token={token} />;
  }
  
  // Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        headerRef.current?.focusSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectOrder = (order: ServiceOrder) => {
    if (currentUser?.role !== UserRole.Viewer) {
      if (isMobile) {
        setEditModalOrder(order); // On mobile, always open the full modal
      } else {
        setDetailPanelOrder(order);
      }
    }
  };

  const handleNotificationClick = (orderId?: string) => {
    if (!orderId) return;
    const orderToOpen = orders.find(o => o.id === orderId);
    if (orderToOpen) {
      handleSelectOrder(orderToOpen);
    }
  };

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
  
  const handleConvertToOS = (quote: CommercialQuote) => {
    const descriptionFromItems = quote.items.map(item => `- ${item.quantity}x ${item.description}`).join('\n');
    setAddModalInitialData({
      client: quote.client,
      orderNumber: `OS-${new Date().getFullYear()}-${orders.length + 1}`,
      description: `Orçamento Aprovado: ${quote.quoteNumber}\n\nItens:\n${descriptionFromItems}`,
      value: quote.value,
      // You can add other fields to map if needed
    });
    setIsAddModalOpen(true);
  };

  const handleOpenFullEditor = (order: ServiceOrder) => {
    setDetailPanelOrder(null);
    setEditModalOrder(order);
  };


  if (!currentUser) {
    return <LoginPage />;
  }
  
  if (isDataLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-coal-black text-white">
        <Loader className="animate-spin text-cadmium-yellow" size={48} />
        <p className="ml-4 text-lg">Carregando dados do projeto...</p>
      </div>
    );
  }
  
  const suspenseFallback = (
    <div className="flex h-full w-full items-center justify-center">
      <Loader className="animate-spin text-cadmium-yellow" size={48} />
      <p className="ml-4 text-lg">Carregando...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-coal-black text-white font-sans">
      {!isMobile && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            ref={headerRef}
            onAddOrderClick={handleOpenAddModal}
            onAddFromTemplateClick={() => setIsTemplateModalOpen(true)}
            onSelectOrderFromSearch={handleSelectOrder}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6">
          <Suspense fallback={suspenseFallback}>
            {currentPage === 'Produção' && (
              <KanbanBoard onSelectOrder={handleSelectOrder} />
            )}
            {currentPage === 'Dashboard' && <DashboardPage onSelectOrder={handleSelectOrder} />}
            {currentPage === 'Comercial' && <CommercialDashboardPage onConvertToOS={handleConvertToOS} />}
            {currentPage === 'Agenda' && <AgendaPage onSelectOrder={handleSelectOrder} />}
            {currentPage === 'Galeria' && (
              <GalleryPage onSelectOrder={setGallerySelectedItem} />
            )}
            {currentPage === 'Linha do Tempo' && <TimelinePage onSelectOrder={handleSelectOrder} />}
            {currentPage === 'Financeiro' && <FinancialPage />}
            {currentPage === 'Chat' && <ChatPage />}
            {currentPage === 'Relatórios' && <ReportsPage />}
            {currentPage === 'Log de Atividade' && <ActivityLogPage />}
            {currentPage === 'Configurações' && <SettingsPage />}
          </Suspense>
        </main>
      </div>
      
      {isTemplateModalOpen && (
        <TemplateModal 
            onClose={() => setIsTemplateModalOpen(false)}
            onSelect={handleSelectTemplate}
        />
      )}
      
      {isAddModalOpen && (
        <AddOrderModal 
            onClose={() => setIsAddModalOpen(false)}
            initialData={addModalInitialData}
        />
      )}
      
      {detailPanelOrder && (
        <OrderDetailPanel 
          order={detailPanelOrder}
          onClose={() => setDetailPanelOrder(null)}
          onOpenFullEditor={handleOpenFullEditor}
        />
      )}

      {editModalOrder && (
        <EditOrderModal
          order={editModalOrder}
          onClose={() => setEditModalOrder(null)}
        />
      )}
      {gallerySelectedItem && (
        <GalleryDetailModal
          order={gallerySelectedItem}
          onClose={() => setGallerySelectedItem(null)}
        />
      )}
       <NotificationContainer onNotificationClick={handleNotificationClick} />
       {isMobile && <BottomNavBar />}
    </div>
  );
}
