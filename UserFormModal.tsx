import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Loader } from 'lucide-react';

interface UserFormModalProps {
    user: { email: string; role: UserRole } | null;
    onClose: () => void;
    onSave: (user: { email: string; role: UserRole }) => void;
    existingEmails: string[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave, existingEmails }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Assistant);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setEmail(user.email);
            setRole(user.role);
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user && existingEmails.includes(email)) {
            setError('Este e-mail já possui uma permissão.');
            return;
        }

        onSave({ email, role });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation" onClick={onClose}>
            <div className="bg-coal-black rounded-xl p-8 w-full max-w-md border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 font-display">{user ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-granite-gray-light mb-1">E-mail do Usuário</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                            required
                            disabled={!!user} // Disable email editing
                        />
                         {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                    <div className="mb-6">
                        <label htmlFor="role" className="block text-sm font-medium text-granite-gray-light mb-1">Permissão</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                        >
                            {Object.values(UserRole).map(roleValue => (
                                <option key={roleValue} value={roleValue}>{roleValue}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="px-6 py-2 w-28 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
