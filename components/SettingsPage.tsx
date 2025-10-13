import React, { useState } from 'react';
import { Settings, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useAppContext } from './AppContext';
import { User, UserRole } from '../types';
import { UserFormModal } from './UserFormModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';


const roleColors: Record<UserRole, string> = {
    [UserRole.Admin]: 'bg-red-500/20 text-red-300 border-red-500/30',
    [UserRole.Assistant]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [UserRole.Viewer]: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export const SettingsPage: React.FC = () => {
    const { users, addUser, updateUser, deleteUser, currentUser } = useAppContext();
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleOpenAddModal = () => {
        setUserToEdit(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setUserToEdit(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = (user: User) => {
        if (userToEdit) {
            updateUser(user);
        } else {
            addUser(user);
        }
        setIsUserModalOpen(false);
        setUserToEdit(null);
    };

    const handleDeleteUser = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };


  return (
    <div className="max-w-5xl mx-auto text-white p-4 h-full flex flex-col">
      <div className="flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
            <Settings size={32} className="text-cadmium-yellow mr-4" />
            <h1 className="text-2xl md:text-3xl font-bold font-display">Configurações</h1>
        </div>
        <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95"
        >
            <PlusCircle size={18} className="mr-2" />
            Novo Usuário
        </button>
      </div>

      <div className="flex-1 bg-black/20 p-4 md:p-6 rounded-lg border border-granite-gray/20 overflow-hidden flex flex-col">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Gerenciamento de Usuários (Modo de Demonstração)</h2>
        <div className="flex-1 overflow-y-auto">
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {users.map(user => (
                <div key={user.id} className="bg-granite-gray/10 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img src={user.picture} alt={user.name} className="h-10 w-10 rounded-full mr-4" />
                      <div>
                          <p className="font-semibold text-gray-100">{user.name}</p>
                          <p className="text-sm text-granite-gray-light">{user.email}</p>
                      </div>
                    </div>
                     <span className={`px-2 py-1 text-xs font-bold rounded-full border ${roleColors[user.role]}`}>
                        {user.role}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-granite-gray/20 flex justify-end gap-2">
                     <button onClick={() => handleOpenEditModal(user)} className="p-2 text-granite-gray-light hover:text-cadmium-yellow transition-colors">
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => setUserToDelete(user)}
                        disabled={user.id === currentUser?.id}
                        className="p-2 text-granite-gray-light hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <table className="w-full text-left hidden md:table">
                <thead className="sticky top-0 bg-coal-black/80 backdrop-blur-sm">
                    <tr>
                        <th className="p-4 font-semibold text-gray-400">Usuário</th>
                        <th className="p-4 font-semibold text-gray-400">Função</th>
                        <th className="p-4 font-semibold text-gray-400 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-granite-gray/20 hover:bg-granite-gray/10">
                            <td className="p-4 flex items-center">
                                <img src={user.picture} alt={user.name} className="h-10 w-10 rounded-full mr-4" />
                                <div>
                                    <p className="font-semibold text-gray-100">{user.name}</p>
                                    <p className="text-sm text-granite-gray-light">{user.email}</p>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full border ${roleColors[user.role]}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button onClick={() => handleOpenEditModal(user)} className="p-2 text-granite-gray-light hover:text-cadmium-yellow transition-colors mr-2">
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => setUserToDelete(user)}
                                    disabled={user.id === currentUser?.id}
                                    className="p-2 text-granite-gray-light hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      
      {isUserModalOpen && (
        <UserFormModal
            user={userToEdit}
            onClose={() => setIsUserModalOpen(false)}
            onSave={handleSaveUser}
        />
      )}

      {userToDelete && (
        <ConfirmDeleteModal
            userName={userToDelete.name}
            onConfirm={handleDeleteUser}
            onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
};