import React from 'react';
import { UserRole } from '../types';
import { PlusCircle, Bot, Search, XCircle, LogOut, LayoutGrid } from 'lucide-react';
import { useAppContext } from './AppContext';

interface HeaderProps {
  onAddOrderClick: () => void;
  onAddFromTemplateClick: () => void;
}

const pageTitles: { [key: string]: string } = {
  'Produção': 'Painel de Produção',
  'Dashboard': 'Dashboard',
  'Agenda': 'Agenda de Entregas',
  'Galeria': 'Galeria',
  'Linha do Tempo': 'Linha do Tempo',
  'Relatórios': 'Relatórios de Desempenho',
  'Log de Atividade': 'Log de Atividade',
  'Configurações': 'Configurações',
};


export const Header: React.FC<HeaderProps> = ({ onAddOrderClick, onAddFromTemplateClick }) => {
  const {
    currentPage,
    currentUser,
    logout,
    searchTerm,
    setSearchTerm,
    isStalledFilterActive,
    clearFilters
  } = useAppContext();

  if (!currentUser) return null;

  return (
    <header className="flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 border-b border-granite-gray/20 gap-4">
      <h1 className="text-xl md:text-2xl font-bold font-display text-gray-200">{pageTitles[currentPage] || 'DZ Studio'}</h1>
      <div className="w-full md:w-auto flex items-center justify-between md:justify-end md:space-x-4">
        {currentPage === 'Produção' && (
          <div className="flex-grow md:flex-grow-0">
            {isStalledFilterActive ? (
                <div className="flex items-center bg-yellow-900/50 border border-yellow-400/30 text-yellow-200 rounded-lg px-3 py-2 text-sm">
                    <span>Pendentes</span>
                    <button onClick={clearFilters} className="ml-2 hover:text-white">
                        <XCircle size={16} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                        aria-label="Search orders"
                    />
                </div>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-black/30 border border-granite-gray/50 rounded-lg pl-3 pr-2 py-1.5">
                <div className="text-right hidden sm:block">
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

            {currentUser.role !== UserRole.Viewer && (
                <div className="flex items-center">
                     <button 
                        onClick={onAddFromTemplateClick}
                        className="hidden md:flex items-center px-4 py-2 bg-granite-gray/20 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/40 transition-colors"
                     >
                        <LayoutGrid size={16} className="mr-2" />
                        Modelo
                    </button>
                    <button 
                        onClick={onAddOrderClick}
                        className="flex items-center p-2 md:px-3 md:py-1.5 bg-cadmium-yellow/80 rounded-lg text-sm font-bold text-coal-black hover:bg-cadmium-yellow transition-all transform active:scale-95"
                    >
                      <PlusCircle size={18} className="md:mr-2" />
                      <span className="hidden md:inline">Nova OS</span>
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};