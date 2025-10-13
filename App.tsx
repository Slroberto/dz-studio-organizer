import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { AddOrderModal } from './components/AddOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { GalleryPage } from './components/GalleryPage';
import { GalleryDetailModal } from './components/GalleryDetailModal';
import { NotificationContainer } from './components/NotificationContainer';
import { DailySummaryModal } from './components/DailySummaryModal';
import { ServiceOrder, UserRole, ServiceOrderTemplate } from './types';
import { LoginPage } from './components/LoginPage';
import { ActivityLogPage } from './components/ActivityLogPage';
import { DashboardPage } from './components/DashboardPage';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { AgendaPage } from './components/AgendaPage';
import { TemplateModal } from './components/TemplateModal';
import { useAppContext } from './components/AppContext';
import { Loader, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { BottomNavBar } from './components/BottomNavBar';
import { TimelinePage } from './components/TimelinePage';

// IMPORTAÇÃO NOVA
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

const InitializationErrorDisplay: React.FC<{ message: string; onRetry: () => void; onLogout: () => void; }> = ({ message, onRetry, onLogout }) => (
  <div className="flex h-screen w-full items-center justify-center bg-coal-black text-white p-4">
    <div className="w-full max-w-lg text-center p-8 bg-black/20 rounded-xl border border-red-500/30">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold font-display text-red-300 mb-2">Falha na Inicialização</h1>
        <p className="text-gray-400 mb-6">
            Não foi possível conectar aos serviços. Isso pode ocorrer se as credenciais do Firebase não estiverem configuradas corretamente no arquivo `firebase.ts`. Verifique o console para mais detalhes.
        </p>
        <div className="p-4 bg-black/30 rounded-md text-sm text-red-200 text-left font-mono mb-6">
            <strong>Detalhes do Erro:</strong> {message}
        </div>
        <div className="flex justify-center gap-4">
            <button onClick={onLogout} className="flex items-center px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors">
                <LogOut size={16} className="mr-2" />
                Sair
            </button>
            <button onClick={onRetry} className="flex items-center px-6 py-2 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95">
                <RefreshCw size={16} className="mr-2" />
                Tentar Novamente
            </button>
        </div>
    </div>
  </div>
);

export default function App() {
  const {
    currentUser,
    orders,
    currentPage,
    isDataLoading,
    initializationError,
    fetchAllData,
    logout
  } = useAppContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<Partial<ServiceOrder> | undefined>(undefined);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [gallerySelectedItem, setGallerySelectedItem] = useState<ServiceOrder | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleNotificationClick = (orderId?: string) => {
    if (!orderId) return;
    const orderToOpen = orders.find(o => o.id === orderId);
    if (orderToOpen) {
      if (currentUser?.role !== UserRole.Viewer) {
        setSelectedOrder(orderToOpen);
      }
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

  if (initializationError) {
    return <InitializationErrorDisplay message={initializationError} onRetry={fetchAllData} onLogout={logout} />;
  }
  
  if (!currentUser) {
    return <LoginPage />;
  }
  
  if (isDataLoading && orders.length === 0) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-coal-black text-white">
        <Loader className="animate-spin text-cadmium-yellow" size={48} />
        <p className="ml-4 text-lg">Carregando dados do projeto...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-coal-black text-white font-sans">
      {!isMobile && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            onAddOrderClick={handleOpenAddModal}
            onAddFromTemplateClick={() => setIsTemplateModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6">

          {/* BLOCO NOVO: preview da leitura do Firestore */}
          <FirestoreOrdersPreview />

          {currentPage === 'Produção' && (
            <KanbanBoard onSelectOrder={setSelectedOrder} />
          )}
          {currentPage === 'Dashboard' && <DashboardPage onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Agenda' && <AgendaPage onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Galeria' && (
            <GalleryPage onSelectOrder={setGallerySelectedItem} />
          )}
          {currentPage === 'Linha do Tempo' && <TimelinePage onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Relatórios' && <ReportsPage />}
          {currentPage === 'Log de Atividade' && <ActivityLogPage />}
          {currentPage === 'Configurações' && <SettingsPage />}
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

      {selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
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
