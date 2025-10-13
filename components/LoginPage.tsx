import React, { useState } from 'react';
import { Camera, Loader, User, Lock } from 'lucide-react';
import { useAppContext } from './AppContext';

export const LoginPage: React.FC = () => {
  const { login, isInitializing, authError } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await login(email, password);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-coal-black text-white">
      <div className="w-full max-w-sm p-8 space-y-8 bg-black/20 rounded-2xl border border-granite-gray/20 shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Camera className="text-cadmium-yellow h-10 w-10" />
            <h1 className="text-4xl font-display font-bold ml-3">DZ Studio</h1>
          </div>
          <p className="text-granite-gray-light">Faça login para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-granite-gray" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full bg-black/30 border border-granite-gray/50 rounded-lg pl-10 pr-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isInitializing}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-coal-black bg-cadmium-yellow hover:brightness-110 transition-transform transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-coal-black focus:ring-cadmium-yellow disabled:opacity-50 disabled:cursor-wait"
            >
              {isInitializing ? (
                <>
                  <Loader size={20} className="animate-spin mr-3" />
                  <span>Entrando...</span>
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
           {authError && !isInitializing && (
              <p className="mt-4 text-sm text-red-400 text-center">{authError}</p>
          )}
        </form>
      </div>
    </div>
  );
};
