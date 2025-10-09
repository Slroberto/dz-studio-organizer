import React from 'react';
import { UserRole } from '../types';
import { PlusCircle, Bot, Search, XCircle, LogOut } from 'lucide-react';
import { useAppContext } from './AppContext';

interface HeaderProps {
  onAddOrderClick: () => void;
}

const pageTitles: { [key: string]: string } = {
  'Produção': 'Painel de Produção',
  'Dashboard': 'Dashboard',
  'Galeria': 'Galeria',
  'Relatórios': 'Relatórios de Desempenho',
  'Log de Atividade': 'Log de Atividade',
  'Configurações': 'Configurações',
};


export const Header: React.FC<HeaderProps> = ({ onAddOrderClick }) => {
  const {
    currentPage,
    currentUser,
    logout,
    // generateSummary,
    // isSummaryLoading,
    searchTerm,
    setSearchTerm,
    isStalledFilterActive,
    clearFilters
  } = useAppContext();

  if (!currentUser) return null;

  return (
    <header className="flex-shrink-0 flex items-center justify-between p-6 border-b border-granite-gray/20">
      <h1 className="text-2xl font-bold font-display text-gray-200">{pageTitles[currentPage] || 'DZ Studio'}</h1>
      <div className="flex items-center space-x-4">
        {currentPage === 'Produção' && (
          <>
            {isStalledFilterActive ? (
                <div className="flex items-center bg-yellow-900/50 border border-yellow-400/30 text-yellow-200 rounded-lg px-3 py-2 text-sm">
                    <span>Filtro ativo: Pendentes</span>
                    <button onClick={clearFilters} className="ml-2 hover:text-white">
                        <XCircle size={16} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <input
                        type="text"
                        placeholder="Buscar cliente, OS ou status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                        aria-label="Buscar ordens de serviço"
                    />
                </div>
            )}
            {/* Gemini summary button can be re-enabled later */}
            {/* <button
                onClick={generateSummary}
                disabled={isSummaryLoading}
                className="flex items-center px-4 py-2 bg-gray-800/50 border border-granite-gray/50 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/20 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                <Bot size={18} className={`mr-2 ${isSummaryLoading ? 'animate-spin' : ''}`} />
                {isSummaryLoading ? 'Gerando...' : 'Resumo Diário'}
            </button> */}
          </>
        )}

        <div className="flex items-center space-x-3 bg-black/30 border border-granite-gray/50 rounded-lg pl-3 pr-2 py-1.5">
            <div className="text-right">
                <p className="text-sm font-semibold text-gray-200">{currentUser.name}</p>
                <p className="text-xs text-cadmium-yellow">{currentUser.role}</p>
            </div>
             <img src={currentUser.picture} alt={currentUser.name} className="h-8 w-8 rounded-full" />
            <button 
                onClick={logout}
                className="p-2 text-granite-gray hover:text-white rounded-full hover:bg-granite-gray/20 transition-colors"
                title="Sair"
            >
                <LogOut size={18} />
            </button>
        </div>

        {currentPage === 'Produção' && currentUser.role !== UserRole.Viewer && (
            <button 
                onClick={onAddOrderClick}
                className="flex items-center px-4 py-2 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95"
            >
              <PlusCircle size={18} className="mr-2" />
              Nova OS
            </button>
        )}
      </div>
    </header>
  );
};
