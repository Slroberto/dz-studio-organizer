import React, { useEffect } from 'react';
import { ServiceOrder } from '../types';
import { X, ExternalLink, Download, User, Calendar, Hash, FileText } from 'lucide-react';

interface GalleryDetailModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const GalleryDetailModal: React.FC<GalleryDetailModalProps> = ({ order, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const formattedDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 modal-backdrop-animation"
            onClick={onClose}
        >
            <div 
                className="bg-coal-black rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row border border-granite-gray/20 shadow-2xl modal-content-animation"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full md:w-3/5 flex-shrink-0 bg-black/20 md:rounded-l-xl flex items-center justify-center p-4">
                    <img 
                        src={order.thumbnailUrl} 
                        alt={order.description} 
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                </div>
                <div className="w-full md:w-2/5 p-6 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold font-display">{order.client}</h2>
                        <button onClick={onClose} className="text-granite-gray-light hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-3 text-gray-300 mb-6">
                        <div className="flex items-center text-sm">
                            <Hash size={14} className="mr-3 text-granite-gray-light flex-shrink-0"/>
                            <span>{order.orderNumber}</span>
                        </div>
                        <div className="flex items-start text-sm">
                            <FileText size={14} className="mr-3 mt-0.5 text-granite-gray-light flex-shrink-0"/>
                            <p>{order.description}</p>
                        </div>
                         <div className="flex items-center text-sm">
                            <Calendar size={14} className="mr-3 text-granite-gray-light flex-shrink-0"/>
                            <span>Entregue em: {formattedDate}</span>
                        </div>
                         <div className="flex items-center text-sm">
                            <User size={14} className="mr-3 text-granite-gray-light flex-shrink-0"/>
                            <span>Responsável: {order.responsible || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-granite-gray/20 flex flex-col space-y-3">
                         {order.link ? (
                            <a
                                href={order.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center px-4 py-2 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95"
                            >
                                <Download size={16} className="mr-2" />
                                Baixar do Drive
                            </a>
                         ) : (
                             <button
                                disabled
                                className="w-full flex items-center justify-center px-4 py-2 bg-granite-gray/20 rounded-lg text-sm font-bold text-granite-gray-light cursor-not-allowed"
                             >
                                <Download size={16} className="mr-2" />
                                Link do Drive indisponível
                             </button>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};