import React, { useState, useMemo } from 'react';
import { UserRole } from '../types';
import { USER_ROLES } from '../constants';
import { PlusCircle, Edit, Trash2, Shield, User, AlertTriangle } from 'lucide-react';
import { UserFormModal } from './UserFormModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

type EditableUserRole = { email: string; role: UserRole };

export const SettingsPage: React.FC = () => {
    const [userRoles, setUserRoles] = useState<EditableUserRole[]>(
        Object.entries(USER_ROLES).map(([email, role]) => ({ email, role }))
    );
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<EditableUserRole | null>(null);
    const [userToDelete, setUserToDelete] = useState<EditableUserRole | null>(null);

    const handleOpenAddModal = () => {
        setUserToEdit(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (user: EditableUserRole) => {
        setUserToEdit(user);
        setIsFormModalOpen(true);
    };

    const handleSaveUser = (user: EditableUserRole) => {
        if (userToEdit) {
            // Editing existing user
            setUserRoles(prev => prev.map(u => u.email === userToEdit.email ? user : u));
        } else {
            // Adding new user
            setUserRoles(prev => [...prev, user]);
        }
        setIsFormModalOpen(false);
        setUserToEdit(null);
    };
    
    const handleDeleteUser = (user: EditableUserRole) => {
        setUserRoles(prev => prev.filter(u => u.email !== user.email));
        setUserToDelete(null);
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full">
            <div className="flex-shrink-0 flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold font-display">Gerenciamento de Acesso</h2>
                    <p className="text-granite-gray-light">Adicione, edite ou remova o acesso de usuários ao sistema.</p>
                </div>
                <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center px-4 py-2 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95"
                >
                    <PlusCircle size={18} className="mr-2" />
                    Adicionar Usuário
                </button>
            </div>

            <div className="p-4 bg-yellow-900/40 border border-yellow-500/50 rounded-lg mb-6 flex items-start">
                <AlertTriangle size={20} className="text-yellow-300 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-200 text-sm">
                    <strong>Atenção:</strong> Como o aplicativo está em modo de teste, as alterações feitas aqui não serão salvas permanentemente e serão revertidas ao recarregar a página.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/20 p-4 rounded-lg border border-granite-gray/20">
                <table className="w-full text-left">
                    <thead className="border-b border-granite-gray/50">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-granite-gray-light">Usuário (E-mail)</th>
                            <th className="p-3 text-sm font-semibold text-granite-gray-light">Permissão</th>
                            <th className="p-3 text-sm font-semibold text-granite-gray-light text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userRoles.map(user => (
                            <tr key={user.email} className="border-b border-granite-gray/20 last:border-b-0 hover:bg-granite-gray/10">
                                <td className="p-4 flex items-center">
                                    <User size={16} className="text-granite-gray-light mr-3" />
                                    <span className="font-medium text-gray-200">{user.email}</span>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center text-sm text-cadmium-yellow">
                                        <Shield size={14} className="mr-2" />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleOpenEditModal(user)} className="p-2 text-granite-gray-light hover:text-white" title="Editar">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => setUserToDelete(user)} className="p-2 text-granite-gray-light hover:text-red-500" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <UserFormModal 
                    user={userToEdit} 
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={handleSaveUser}
                    existingEmails={userRoles.map(u => u.email)}
                />
            )}
            
            {userToDelete && (
                <ConfirmDeleteModal
                    userName={userToDelete.email}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={() => handleDeleteUser(userToDelete)}
                />
            )}
        </div>
    );
};
