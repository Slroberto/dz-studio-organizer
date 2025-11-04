

import React from 'react';
import { LayoutDashboard, GanttChartSquare, GalleryHorizontal, Settings, Briefcase, Landmark, MessageCircle } from 'lucide-react';
import { useAppContext } from './AppContext';

const NavItem = ({ icon, text, active, onClick }: { icon: React.ReactNode, text: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${active ? 'text-cadmium-yellow' : 'text-granite-gray-light hover:text-white'}`}
  >
    {icon}
    <span className={`text-sm mt-1.5 ${active ? 'font-bold' : 'font-medium'}`}>{text}</span>
  </button>
);

export const BottomNavBar: React.FC = () => {
    const { currentPage, setCurrentPage } = useAppContext();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-lg border-t border-granite-gray/20 z-40 flex md:hidden">
            <NavItem icon={<LayoutDashboard size={28} />} text="Dashboard" active={currentPage === 'Dashboard'} onClick={() => setCurrentPage('Dashboard')} />
            <NavItem icon={<MessageCircle size={28} />} text="Chat" active={currentPage === 'Chat'} onClick={() => setCurrentPage('Chat')} />
            <NavItem icon={<GanttChartSquare size={28} />} text="Produção" active={currentPage === 'Produção'} onClick={() => setCurrentPage('Produção')} />
            <NavItem icon={<GalleryHorizontal size={28} />} text="Galeria" active={currentPage === 'Galeria'} onClick={() => setCurrentPage('Galeria')} />
            <NavItem icon={<Settings size={28} />} text="Ajustes" active={currentPage === 'Configurações'} onClick={() => setCurrentPage('Configurações')} />
        </nav>
    );
};