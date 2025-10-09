import React, { useState, useEffect } from 'react';
import { ServiceOrder } from '../types';
import { useAppContext } from './AppContext';
import { Loader } from 'lucide-react';

interface AddOrderModalProps {
  onClose: () => void;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({ onClose }) => {
  const { addOrder, isDataLoading } = useAppContext();
  const [client, setClient] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [description, setDescription] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [imageCount, setImageCount] = useState('');


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !orderNumber || !description) return;
    
    const orderData: Omit<ServiceOrder, 'id' | 'status' | 'progress' | 'lastStatusUpdate' | 'creationDate'> & { imageCount?: number } = {
        client,
        orderNumber,
        description,
        thumbnailUrl: `https://picsum.photos/seed/${client.replace(/\s+/g, '')}/400/300`,
        imageCount: parseInt(imageCount, 10) || 0,
    };

    if (expectedDeliveryDate) {
        const date = new Date(expectedDeliveryDate);
        date.setHours(12); // Avoid timezone issues
        orderData.expectedDeliveryDate = date.toISOString();
    }

    await addOrder(orderData);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation"
        onClick={onClose}
    >
      <div 
        className="bg-coal-black rounded-xl p-8 w-full max-w-md border border-granite-gray/20 shadow-2xl modal-content-animation"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 font-display">Nova Ordem de Serviço</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="client" className="block text-sm font-medium text-granite-gray-light mb-1">Cliente</label>
            <input
              type="text"
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-granite-gray-light mb-1">Número da OS</label>
                <input
                  type="text"
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                  required
                />
            </div>
             <div>
                <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-granite-gray-light mb-1">Previsão</label>
                <input
                  type="date"
                  id="expectedDeliveryDate"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                />
            </div>
            <div>
                <label htmlFor="imageCount" className="block text-sm font-medium text-granite-gray-light mb-1">Qtd. Imagens</label>
                <input
                  type="number"
                  id="imageCount"
                  value={imageCount}
                  onChange={(e) => setImageCount(e.target.value)}
                  className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                  min="0"
                />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-granite-gray-light mb-1">Descrição</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isDataLoading}
              className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDataLoading}
              className="px-6 py-2 w-28 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95 disabled:opacity-50"
            >
              {isDataLoading ? <Loader size={18} className="animate-spin mx-auto"/> : 'Criar OS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
