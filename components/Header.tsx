import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { UserRole, ServiceOrder } from '../types';
import { PlusCircle, Bot, Search, XCircle, LogOut, LayoutGrid } from 'lucide-react';
import { useAppContext } from './AppContext';
import { GlobalSearchResults } from './GlobalSearchResults';

interface HeaderProps {
  onAddOrderClick: () => void;
  onAddFromTemplateClick: () => void;
  onSelectOrderFromSearch: (order: ServiceOrder) => void;
}

export interface HeaderRef {
  focusSearch: () => void;
}

const pageTitles: { [key: string]: string } = {
  'Dashboard': 'Dashboard',
  'Produção': 'Painel de Produção',
  'Gestão': 'Gestão do Negócio',
  'Oportunidades': 'Mural de Oportunidades',
  'Galeria': 'Galeria',
  'Chat': 'Chat Interno',
  'Configurações': 'Configurações',
};


export const Header = forwardRef<HeaderRef, HeaderProps>(({ onAddOrderClick, onAddFromTemplateClick, onSelectOrderFromSearch }, ref) => {
  const {
    currentPage,
    currentUser,
    logout,
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
    },
  }));

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentUser) return null;
  
  const handleCloseSearch = () => {
    setIsSearchVisible(false);
    setSearchTerm('');
  };

  return (
    <header className="flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 border-b border-granite-gray/20 gap-4">
      <h1 className="text-xl md:text-2xl font-bold font-display text-gray-200">{pageTitles[currentPage] || 'DZ Studio'}</h1>
      <div className="w-full md:w-auto flex items-center justify-between md:justify-end md:space-x-4">
        
        <div ref={searchContainerRef} className="relative flex-1 md:flex-initial">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Busca global... (Cmd+K)"
              value={searchTerm}
              onFocus={() => setIsSearchVisible(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow transition-all"
            />
          </div>
          {isSearchVisible && searchTerm && (
            <GlobalSearchResults
              searchTerm={searchTerm}
              onClose={handleCloseSearch}
              onSelectOrder={(order) => {
                onSelectOrderFromSearch(order);
                handleCloseSearch();
              }}
              onAddOrderClick={() => {
                onAddOrderClick();
                handleCloseSearch();
              }}
               onAddFromTemplateClick={() => {
                onAddFromTemplateClick();
                handleCloseSearch();
              }}
            />
          )}
        </div>

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
});