import React, { useState, useMemo } from 'react';
import { ServiceOrder } from '../types';
import { GalleryCard } from './GalleryCard';
import { Search, X } from 'lucide-react';
import { useAppContext } from './AppContext';

interface GalleryPageProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onSelectOrder }) => {
    const { deliveredOrders } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = useMemo(() => {
        if (!searchTerm) {
            return deliveredOrders;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return deliveredOrders.filter(order => {
            const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : '';
            return (
                order.client.toLowerCase().includes(lowercasedTerm) ||
                order.orderNumber.toLowerCase().includes(lowercasedTerm) ||
                deliveryDate.includes(lowercasedTerm)
            );
        });
    }, [deliveredOrders, searchTerm]);

    return (
        <div className="h-full flex flex-col">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" />
                    <input
                        type="text"
                        placeholder="Buscar cliente, OS ou data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-72 appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                        aria-label="Search delivered orders"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-granite-gray hover:text-white">
                            <X size={16} />
                        </button>
                    )}
                </div>
                {/* Filters can go here later */}
            </header>
            
            <div className="flex-1 overflow-y-auto pr-2">
                {filteredOrders.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredOrders.map(order => (
                            <GalleryCard key={order.id} order={order} onSelect={onSelectOrder} />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <p className="text-xl text-granite-gray">Nenhuma entrega encontrada para "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </div>
    );
};