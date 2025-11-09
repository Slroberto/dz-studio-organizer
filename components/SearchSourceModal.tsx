import React, { useState, useEffect } from 'react';
import { SearchSource } from '../types';
import { useAppContext } from './AppContext';
import { Loader } from 'lucide-react';

interface SearchSourceModalProps {
  source: SearchSource | null;
  onClose: () => void;
  onSave: (source: SearchSource) => void;
}

export const SearchSourceModal: React.FC<SearchSourceModalProps> = ({ source, onClose, onSave }) => {
    const { isDataLoading } = useAppContext();
    const [formData, setFormData] = useState({
        name: source?.name || 'Workana',
        apiKey: source?.apiKey || '',
        keywords: source?.keywords || '',
        enabled: source?.enabled ?? true,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalSource: SearchSource = {
            id: source?.id || `src-${Date.now()}`,
            name: formData.name as 'Workana' | '99Freelas',
            apiKey: formData.apiKey,
            keywords: formData.keywords,
            enabled: formData.enabled,
        };
        onSave(finalSource);
    };
    
    return (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation" onClick={onClose}>
            <div className="bg-coal-black rounded-xl p-8 w-full max-w-lg border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 font-display">{source ? 'Editar' : 'Adicionar'} Fonte de Busca</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-granite-gray-light mb-1">Plataforma</label>
                        <select
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                        >
                            <option value="Workana">Workana</option>
                            <option value="99Freelas">99Freelas</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-granite-gray-light mb-1">Chave de API (API Key)</label>
                        <input
                            type="password"
                            name="apiKey"
                            id="apiKey"
                            value={formData.apiKey}
                            onChange={handleInputChange}
                            placeholder="Cole sua chave de API aqui"
                            required
                            className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                        />
                    </div>
                    <div>
                        <label htmlFor="keywords" className="block text-sm font-medium text-granite-gray-light mb-1">Palavras-chave</label>
                         <textarea
                            name="keywords"
                            id="keywords"
                            value={formData.keywords}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                            placeholder="Ex: fotógrafo de produto, edição de fotos, retoque de imagem, still life"
                            required
                        />
                        <p className="text-xs text-granite-gray-light mt-1">Separe as palavras-chave por vírgula.</p>
                    </div>
                     <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="enabled"
                            id="enabled"
                            checked={formData.enabled}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded bg-black/30 border-granite-gray-light text-cadmium-yellow focus:ring-cadmium-yellow"
                        />
                        <label htmlFor="enabled" className="text-sm font-medium text-gray-200">Ativar busca automática para esta fonte</label>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-granite-gray/20">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40">Cancelar</button>
                        <button type="submit" disabled={isDataLoading} className="px-6 py-2 w-28 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 disabled:opacity-50">
                            {isDataLoading ? <Loader size={18} className="animate-spin mx-auto"/> : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
