import React from 'react';
import { ServiceOrder } from '../types';
import { User, Calendar, Hash } from 'lucide-react';

interface GalleryCardProps {
  order: ServiceOrder;
  onSelect: (order: ServiceOrder) => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ order, onSelect }) => {
  const formattedDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'N/A';

  return (
    <div
      onClick={() => onSelect(order)}
      className="bg-granite-gray/20 rounded-lg overflow-hidden group cursor-pointer border-2 border-transparent hover:border-cadmium-yellow/70 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="aspect-video overflow-hidden">
        <img 
          src={order.thumbnailUrl} 
          alt={order.description} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 text-white/90">
        <h3 className="font-bold text-lg truncate mb-1" title={order.client}>{order.client}</h3>
        <div className="space-y-2 text-sm text-granite-gray-light">
          <div className="flex items-center">
            <Hash size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate">{order.orderNumber}</span>
          </div>
          <div className="flex items-center">
            <Calendar size={14} className="mr-2 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <User size={14} className="mr-2 flex-shrink-0" />
            <span>{order.responsible || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};