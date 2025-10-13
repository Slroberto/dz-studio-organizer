import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ userName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation" onClick={onCancel}>
      <div className="bg-coal-black rounded-xl p-8 w-full max-w-sm border border-red-500/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2 font-display text-gray-100">Confirmar Exclusão</h2>
          <p className="text-granite-gray-light mb-6">
            Tem certeza que deseja excluir o usuário <strong className="text-white">{userName}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors w-1/2"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 rounded-lg text-sm font-bold text-white hover:bg-red-700 transition-transform transform active:scale-95 w-1/2"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};