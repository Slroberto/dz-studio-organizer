import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import { AddOrderModal } from './components/AddOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { GalleryPage } from './components/GalleryPage';
import { GalleryDetailModal } from './components/GalleryDetailModal';
import { NotificationContainer } from './components/NotificationContainer';
import { DailySummaryModal } from './components/DailySummaryModal';
import { ServiceOrder, UserRole } from './types';
import { LoginPage } from './components/LoginPage';
import { ActivityLogPage } from './components/ActivityLogPage';
import { DashboardPage } from './components/DashboardPage';
import { ReportsPage } from './components/ReportsPage';
import { useAppContext } from './components/AppContext';
import { Loader, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

const InitializationErrorDisplay: React.FC<{ message: string; onRetry: () => void; onLogout: () => void; }> = ({ message, onRetry, onLogout }) => (
  <div className="flex h-screen w-full items-center justify-center bg-coal-black text-white p-4">
    <div className="w-full max-w-lg text-center p-8 bg-black/20 rounded-xl border border-red-500/30">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold font-display text-red-300 mb-2">Falha na Conexão com a Planilha</h1>
        <p className="text-gray-400 mb-6">
            Não foi possível carregar os dados. Isso geralmente ocorre se as variáveis de ambiente (como `VITE_GOOGLE_SHEETS_ID`) não estiverem configuradas corretamente no ambiente de produção (Vercel).
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

  if (!currentUser) {
    return <LoginPage />;
  }

  if (initializationError) {
    return <InitializationErrorDisplay message={initializationError} onRetry={fetchAllData} onLogout={logout} />;
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
          onClose={() => setGallerySelectedItem(null)}
        />
      )}
       <NotificationContainer onNotificationClick={handleNotificationClick} />
      {/* {isSummaryModalOpen && dailySummaryData && (
        <DailySummaryModal 
            summary={dailySummaryData}
            onClose={() => setIsSummaryModalOpen(false)}
        />
      )} */}
    </div>
  );
}
