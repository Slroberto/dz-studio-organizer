import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Loader, Camera } from 'lucide-react';
import { useAppContext } from './AppContext';

interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
  const { isDataLoading } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.Viewer,
    picture: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: user.password || '',
        role: user.role,
        picture: user.picture || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, picture: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUser: User = {
      id: user?.id || '', // Will be replaced by addUser for new users
      name: formData.name,
      email: formData.email,
      password: formData.password || user?.password || '',
      role: formData.role,
      picture: formData.picture,
    };
    await onSave(finalUser);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation" onClick={onClose}>
      <div className="bg-coal-black rounded-xl p-8 w-full max-w-md border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 font-display">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex flex-col items-center">
            <label htmlFor="picture-upload" className="relative cursor-pointer group">
              <img 
                  src={formData.picture || `https://i.pravatar.cc/150?u=${formData.email || 'new'}`}
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-granite-gray/50 group-hover:border-cadmium-yellow transition-colors"
              />
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
              </div>
            </label>
            <input 
                id="picture-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-granite-gray-light mb-1">Nome Completo</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-granite-gray-light mb-1">E-mail</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-granite-gray-light mb-1">Senha (Modo Demo)</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
              placeholder={user ? 'Deixe em branco para não alterar' : ''}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="role" className="block text-sm font-medium text-granite-gray-light mb-1">Função</label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
            >
              <option value={UserRole.Admin}>Admin</option>
              <option value={UserRole.Assistant}>Assistant</option>
              <option value={UserRole.Viewer}>Viewer</option>
            </select>
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