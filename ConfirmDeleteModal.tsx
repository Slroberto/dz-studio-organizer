import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
    userName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ userName, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation" onClick={onClose}>
            <div className="bg-coal-black rounded-xl p-8 w-full max-w-md border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-medium leading-6 text-white" id="modal-title">
                        Excluir Usuário
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-400">
                            Tem certeza que deseja remover o acesso para <strong className="text-gray-200">{userName}</strong>? Esta ação não pode ser desfeita.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                    <button
                        type="button"
                        className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                        onClick={onConfirm}
                    >
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
};
