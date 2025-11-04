import React, { useState, useEffect } from 'react';
import { CatalogServiceItem } from '../types';
import { DollarSign, Loader } from 'lucide-react';
import { useAppContext } from './AppContext';

interface ServiceItemFormModalProps {
  service: CatalogServiceItem | null;
  onClose: () => void;
  onSave: (service: CatalogServiceItem) => void;
}

export const ServiceItemFormModal: React.FC<ServiceItemFormModalProps> = ({ service, onClose, onSave }) => {
  const { isDataLoading } = useAppContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        description: service.description,
        price: service.price,
      });
    }
  }, [service]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalService: CatalogServiceItem = {
      id: service?.id || '', // Handled by context for new items
      title: formData.title,
      description: formData.description,
      price: formData.price,
    };
    await onSave(finalService);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation" onClick={onClose}>
      <div className="bg-coal-black rounded-xl p-8 w-full max-w-lg border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 font-display">{service ? 'Editar Serviço' : 'Novo Serviço do Catálogo'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-granite-gray-light mb-1">Título do Serviço</label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
              placeholder="Ex: Diária de Estúdio"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-granite-gray-light mb-1">Descrição</label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
              placeholder="Descreva o que está incluso no serviço. Esta descrição será usada no orçamento."
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="price" className="block text-sm font-medium text-granite-gray-light mb-1">Preço Padrão (R$)</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <DollarSign className="h-5 w-5 text-granite-gray" />
              </div>
              <input
                type="number"
                name="price"
                id="price"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                required
              />
            </div>
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
              {isDataLoading ? <Loader size={18} className="animate-spin mx-auto" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};