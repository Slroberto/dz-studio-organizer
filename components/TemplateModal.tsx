import React from 'react';
import { ServiceOrderTemplate } from '../types';
import { SERVICE_ORDER_TEMPLATES } from '../constants';
import { X, FilePlus } from 'lucide-react';

interface TemplateModalProps {
  onClose: () => void;
  onSelect: (template: ServiceOrderTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ onClose, onSelect }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation"
      onClick={onClose}
    >
      <div
        className="bg-coal-black rounded-xl p-8 w-full max-w-2xl border border-granite-gray/20 shadow-2xl modal-content-animation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display">Criar a partir de um Modelo</h2>
          <button onClick={onClose} className="text-granite-gray-light hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {SERVICE_ORDER_TEMPLATES.map(template => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className="p-4 bg-granite-gray/10 rounded-lg border border-granite-gray/20 cursor-pointer hover:bg-granite-gray/20 hover:border-cadmium-yellow transition-all"
            >
              <div className="flex items-center mb-2">
                 <FilePlus size={20} className="text-cadmium-yellow mr-3" />
                 <h3 className="font-bold text-lg text-white">{template.title}</h3>
              </div>
              <p className="text-sm text-granite-gray-light">{template.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};