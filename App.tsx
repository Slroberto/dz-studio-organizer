import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header, HeaderRef } from './components/Header';
import { AddOrderModal } from './components/AddOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { GalleryDetailModal } from './components/GalleryDetailModal';
import { NotificationContainer } from './components/NotificationContainer';
import { DailySummaryModal } from './components/DailySummaryModal';
import { ServiceOrder, UserRole, ServiceOrderTemplate, CommercialQuote, Opportunity } from './types';
import { LoginPage } from './components/LoginPage';
import { TemplateModal } from './components/TemplateModal';
import { useAppContext } from './components/AppContext';
import { Loader } from 'lucide-react';
import { BottomNavBar } from './components/BottomNavBar';
import { ClientPortalPage } from './components/ClientPortalPage';
import { OrderDetailPanel } from './components/OrderDetailPanel';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { QuoteEditorModal } from './components/QuoteEditorModal';

// Lazy load page components for better performance
const DashboardPage = lazy(() => import('./components/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ProductionPage = lazy(() => import('./components/ProductionPage').then(module => ({ default: module.ProductionPage })));
const ManagementPage = lazy(() => import('./components/ManagementPage').then(module => ({ default: module.ManagementPage })));
const OpportunitiesPage = lazy(() => import('./components/OpportunitiesPage').then(module => ({ default: module.OpportunitiesPage })));
const ChatPage = lazy(() => import('./components/ChatPage').then(module => ({ default: module.ChatPage })));
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
    deleteOrder,
    addQuote,
    updateQuote
  } = useAppContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<Partial<ServiceOrder> | undefined>(undefined);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // State for Detail Panel (Quick View) and Edit Modal (Full Editor)
  const [detailPanelOrder, setDetailPanelOrder] = useState<ServiceOrder | null>(null);
  const [editModalOrder, setEditModalOrder] = useState<ServiceOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);

  // State for Global Quote Editor
  const [quoteEditorData, setQuoteEditorData] = useState<{ isOpen: boolean; quote: Partial<CommercialQuote> | null }>({ isOpen: false, quote: null });

  
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
  
  const handleConvertToOSFromOpportunity = (opportunity: Opportunity) => {
    setAddModalInitialData({
      client: opportunity.clientOrSource,
      orderNumber: `OS-${new Date().getFullYear()}-${orders.length + 1}`,
      description: `Baseado na Oportunidade: ${opportunity.title}\n\n${opportunity.description || ''}`,
      value: opportunity.budget,
      expectedDeliveryDate: opportunity.deadline,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenFullEditor = (order: ServiceOrder) => {
    setDetailPanelOrder(null);
    setEditModalOrder(order);
  };

  const handleConfirmDelete = async () => {
    if (orderToDelete) {
      await deleteOrder(orderToDelete.id);
      setOrderToDelete(null);
      if (detailPanelOrder?.id === orderToDelete.id) setDetailPanelOrder(null);
      if (editModalOrder?.id === orderToDelete.id) setEditModalOrder(null);
    }
  };

  const handleOpenQuoteEditor = (quote: Partial<CommercialQuote> | null) => {
    setQuoteEditorData({ isOpen: true, quote });
  };

  const handleCloseQuoteEditor = () => {
      setQuoteEditorData({ isOpen: false, quote: null });
  };

  const handleSaveQuote = async (quoteData: CommercialQuote) => {
      if (quoteEditorData.quote && 'id' in quoteEditorData.quote && quoteEditorData.quote.id) {
          await updateQuote(quoteData);
      } else {
          const newQuoteData = {
              ...quoteData,
              responsible: currentUser?.name || 'N/A'
          };
          await addQuote(newQuoteData);
      }
      handleCloseQuoteEditor();
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
            {currentPage === 'Dashboard' && <DashboardPage onSelectOrder={handleSelectOrder} />}
            {currentPage === 'Produção' && <ProductionPage onSelectOrder={handleSelectOrder} onSelectGalleryItem={setGallerySelectedItem} onEditRequest={handleOpenFullEditor} onDeleteRequest={setOrderToDelete} />}
            {currentPage === 'Gestão' && <ManagementPage onConvertToOS={handleConvertToOS} onSelectOrder={handleSelectOrder} onOpenQuoteEditor={handleOpenQuoteEditor} />}
            {currentPage === 'Oportunidades' && <OpportunitiesPage onConvertToOS={handleConvertToOSFromOpportunity} onOpenQuoteEditor={handleOpenQuoteEditor} />}
            {currentPage === 'Chat' && <ChatPage />}
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

       {orderToDelete && (
          <ConfirmDeleteModal
            title="Confirmar Exclusão de OS"
            message={`Tem certeza de que deseja excluir a Ordem de Serviço <strong>${orderToDelete.orderNumber}</strong> para <strong>${orderToDelete.client}</strong>? Esta ação não pode ser desfeita.`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setOrderToDelete(null)}
          />
       )}

      {quoteEditorData.isOpen && (
        <QuoteEditorModal
            quote={quoteEditorData.quote}
            onClose={handleCloseQuoteEditor}
            onSave={handleSaveQuote}
        />
      )}
    </div>
  );
}