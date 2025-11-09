import React, { useState, useEffect } from 'react';
import { Freelancer, RateType, AvailabilityStatus } from '../types';
import { Loader, Camera } from 'lucide-react';
import { useAppContext } from './AppContext';

interface FreelancerFormModalProps {
  freelancer: Freelancer | null;
  onClose: () => void;
  onSave: (freelancer: Freelancer) => void;
}

export const FreelancerFormModal: React.FC<FreelancerFormModalProps> = ({ freelancer, onClose, onSave }) => {
  const { isDataLoading } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    picture: '',
    specialty: 'Retoque',
    rateType: 'hora' as RateType,
    rateValue: 0,
    availability: 'Disponível' as AvailabilityStatus,
    portfolioLink: '',
    notes: '',
  });

  useEffect(() => {
    if (freelancer) {
      setFormData({
        name: freelancer.name,
        email: freelancer.email,
        picture: freelancer.picture || '',
        specialty: freelancer.specialty,
        rateType: freelancer.rateType,
        rateValue: freelancer.rateValue,
        availability: freelancer.availability,
        portfolioLink: freelancer.portfolioLink || '',
        notes: freelancer.notes || '',
      });
    }
  }, [freelancer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFreelancer: Freelancer = {
      id: freelancer?.id || '',
      ...formData
    };
    await onSave(finalFreelancer);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation" onClick={onClose}>
      <div className="bg-coal-black rounded-xl p-8 w-full max-w-lg border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 font-display">{freelancer ? 'Editar Freelancer' : 'Novo Freelancer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Nome Completo" required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="E-mail" required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
            </div>
            <div>
                <label className="text-xs text-granite-gray-light">Especialidade Principal</label>
                <input name="specialty" value={formData.specialty} onChange={handleInputChange} placeholder="Ex: Retoque, Food Styling" required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-granite-gray-light">Tipo de Cobrança</label>
                    <select name="rateType" value={formData.rateType} onChange={handleInputChange} className="w-full bg-black/30 p-2 rounded border border-granite-gray/50">
                        <option value="hora">Por Hora</option>
                        <option value="dia">Por Dia</option>
                        <option value="projeto">Por Projeto</option>
                    </select>
                </div>
                 <div>
                    <label className="text-xs text-granite-gray-light">Valor (R$)</label>
                    <input name="rateValue" type="number" step="0.01" value={formData.rateValue} onChange={handleInputChange} required className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
                </div>
            </div>
             <div>
                <label className="text-xs text-granite-gray-light">Disponibilidade</label>
                <select name="availability" value={formData.availability} onChange={handleInputChange} className="w-full bg-black/30 p-2 rounded border border-granite-gray/50">
                    <option value="Disponível">Disponível</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Férias">Férias</option>
                </select>
            </div>
             <div>
                <label className="text-xs text-granite-gray-light">Link do Portfólio</label>
                <input name="portfolioLink" value={formData.portfolioLink} onChange={handleInputChange} placeholder="https://..." className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
            </div>
            <div>
                <label className="text-xs text-granite-gray-light">Anotações</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} placeholder="Informações adicionais, contato, etc." className="w-full bg-black/30 p-2 rounded border border-granite-gray/50" />
            </div>
            <div className="flex justify-end space-x-4 pt-4 border-t border-granite-gray/20">
                <button type="button" onClick={onClose} disabled={isDataLoading} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40">Cancelar</button>
                <button type="submit" disabled={isDataLoading} className="px-6 py-2 w-28 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 disabled:opacity-50">
                    {isDataLoading ? <Loader size={18} className="animate-spin mx-auto" /> : 'Salvar'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};