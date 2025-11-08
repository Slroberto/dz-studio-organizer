





import React, { useState } from 'react';
import { LayoutDashboard, Camera, GanttChartSquare, ChevronLeft, ChevronRight, Settings, Briefcase, MessageCircle } from 'lucide-react';
import { useAppContext } from './AppContext';

const NavItem = ({ icon, text, active, collapsed, onClick }: { icon: React.ReactNode, text: string, active?: boolean, collapsed: boolean, onClick: () => void }) => (
  <li onClick={onClick} className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${active ? 'bg-cadmium-yellow text-coal-black' : 'hover:bg-gray-800'}`}>
    {icon}
    {!collapsed && <span className="ml-4 font-medium transition-opacity duration-300">{text}</span>}
  </li>
);

export const Sidebar: React.FC = () => {
    const { currentPage, setCurrentPage } = useAppContext();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`flex flex-col h-full bg-black/20 p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-64'}`}>
            <div className="flex items-center mb-10 pl-2">
                <Camera className="text-cadmium-yellow h-8 w-8" />
                {!isCollapsed && <h1 className="text-2xl font-display font-bold ml-3">DZ Studio</h1>}
            </div>

            <nav className="flex-1">
                <ul>
                    <NavItem icon={<LayoutDashboard size={24} />} text="Dashboard" collapsed={isCollapsed} active={currentPage === 'Dashboard'} onClick={() => setCurrentPage('Dashboard')} />
                    <NavItem icon={<GanttChartSquare size={24} />} text="Produção" active={currentPage === 'Produção'} collapsed={isCollapsed} onClick={() => setCurrentPage('Produção')} />
                    <NavItem icon={<Briefcase size={24} />} text="Gestão" collapsed={isCollapsed} active={currentPage === 'Gestão'} onClick={() => setCurrentPage('Gestão')} />
                    <NavItem icon={<MessageCircle size={24} />} text="Chat" collapsed={isCollapsed} active={currentPage === 'Chat'} onClick={() => setCurrentPage('Chat')} />
                    <NavItem icon={<Settings size={24} />} text="Configurações" collapsed={isCollapsed} active={currentPage === 'Configurações'} onClick={() => setCurrentPage('Configurações')} />
                </ul>
            </nav>

            <div className="flex justify-center">
                 <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                    {isCollapsed ? <ChevronRight size={24} className="text-granite-gray"/> : <ChevronLeft size={24} className="text-granite-gray"/>}
                </button>
            </div>
        </div>
    );
};