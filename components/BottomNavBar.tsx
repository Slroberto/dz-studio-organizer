



import React from 'react';
import { LayoutDashboard, GanttChartSquare, Settings, MessageCircle, Briefcase } from 'lucide-react';
import { useAppContext } from './AppContext';

const NavItem = ({ icon, text, active, onClick }: { icon: React.ReactNode, text: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${active ? 'text-cadmium-yellow' : 'text-granite-gray-light hover:text-white'}`}
  >
    {icon}
    <span className={`text-xs mt-1 ${active ? 'font-bold' : 'font-medium'}`}>{text}</span>
  </button>
);

export const BottomNavBar: React.FC = () => {
    const { currentPage, setCurrentPage } = useAppContext();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-lg border-t border-granite-gray/20 z-40 flex md:hidden">
            <NavItem icon={<LayoutDashboard size={24} />} text="Dashboard" active={currentPage === 'Dashboard'} onClick={() => setCurrentPage('Dashboard')} />
            <NavItem icon={<GanttChartSquare size={24} />} text="Produção" active={currentPage === 'Produção'} onClick={() => setCurrentPage('Produção')} />
            <NavItem icon={<Briefcase size={24} />} text="Gestão" active={currentPage === 'Gestão'} onClick={() => setCurrentPage('Gestão')} />
            <NavItem icon={<MessageCircle size={24} />} text="Chat" active={currentPage === 'Chat'} onClick={() => setCurrentPage('Chat')} />
            <NavItem icon={<Settings size={24} />} text="Ajustes" active={currentPage === 'Configurações'} onClick={() => setCurrentPage('Configurações')} />
        </nav>
    );
};