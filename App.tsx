import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { AddOrderModal } from './components/AddOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { GalleryPage } from './components/GalleryPage';
import { GalleryDetailModal } from './components/GalleryDetailModal';
import { NotificationContainer } from './components/NotificationContainer';
import { DailySummaryModal } from './components/DailySummaryModal';
import { SettingsPage } from './components/SettingsPage';
import { ServiceOrder, UserRole } from './types';
import { LoginPage } from './components/LoginPage';
import { ActivityLogPage } from './components/ActivityLogPage';
import { DashboardPage } from './components/DashboardPage';
import { ReportsPage } from './components/ReportsPage';
import { useAppContext } from './components/AppContext';
import { Loader } from 'lucide-react';

export default function App() {
  const {
    currentUser,
    orders,
    currentPage,
    isInitializing,
    isDataLoading,
  } = useAppContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [gallerySelectedItem, setGallerySelectedItem] = useState<ServiceOrder | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  // Daily summary logic can be re-enabled later if needed
  // const [dailySummaryData, setDailySummaryData] = useState<DailySummaryData | null>(null);

  const handleNotificationClick = (orderId?: string) => {
    if (!orderId) return;
    const orderToOpen = orders.find(o => o.id === orderId);
    if (orderToOpen) {
      if (currentUser?.role !== UserRole.Viewer) {
        setSelectedOrder(orderToOpen);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-coal-black text-white">
        <Loader className="animate-spin text-cadmium-yellow" size={48} />
        <p className="ml-4 text-lg">Conectando aos serviços Google...</p>
      </div>
    );
  }

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

  return (
    <div className="flex h-screen bg-coal-black text-white font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onAddOrderClick={() => setIsAddModalOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          {currentPage === 'Produção' && (
            <KanbanBoard onSelectOrder={setSelectedOrder} />
          )}
          {currentPage === 'Dashboard' && <DashboardPage onSelectOrder={setSelectedOrder} />}
          {currentPage === 'Galeria' && (
            <GalleryPage onSelectOrder={setGallerySelectedItem} />
          )}
          {currentPage === 'Relatórios' && <ReportsPage />}
          {currentPage === 'Log de Atividade' && <ActivityLogPage />}
          {currentPage === 'Configurações' && <SettingsPage />} {/* Rota de Configurações */}
        </main>
      </div>
      {isAddModalOpen && (
        <AddOrderModal onClose={() => setIsAddModalOpen(false)} />
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
          onClose={() => setGallerySelectedItem(null)} // <-- Linha corrigida (erro de sintaxe)
        />
      )}
      <NotificationContainer onNotificationClick={handleNotificationClick} />
      {/* Bloco de comentário do DailySummaryModal limpo para evitar erros de sintaxe */}
      {/* {isSummaryModalOpen && dailySummaryData && (
          <DailySummaryModal 
              summary={dailySummaryData}
              onClose={() => setIsSummaryModalOpen(false)}
          />
        )} 
      */}
    </div>
  );
}
