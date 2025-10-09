import React from 'react';
import { Camera, Loader } from 'lucide-react';
import { useAppContext } from './AppContext';

// A simple SVG for the Google icon
const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.512-11.187-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


export const LoginPage: React.FC = () => {
  const { login, isInitializing, authError } = useAppContext();

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
        <div className="pt-4">
            <button
              onClick={login}
              disabled={isInitializing}
              className="w-full flex items-center justify-center py-3 px-4 border border-granite-gray/50 rounded-lg shadow-sm text-sm font-bold text-white bg-black/30 hover:bg-granite-gray/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-coal-black focus:ring-cadmium-yellow disabled:opacity-50 disabled:cursor-wait"
            >
              {isInitializing ? (
                <>
                  <Loader size={20} className="animate-spin mr-3" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Entrar com o Google
                </>
              )}
            </button>
            
            {authError && !isInitializing && (
                <p className="mt-4 text-sm text-red-500 text-center">{authError}</p>
            )}
        </div>
      </div>
    </div>
  );
};