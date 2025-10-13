import React, { useState } from 'react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface AddOrderModalProps {
  onClose: () => void;
  initialData?: Partial<{
    cliente: string;
    descricao: string;
    status: string;
  }>;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({ onClose, initialData }) => {
  const [cliente, setCliente] = useState(initialData?.cliente || '');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [status, setStatus] = useState(initialData?.status || 'Aberta');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!cliente || !descricao) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setSalvando(true);

    try {
      await addDoc(collection(db, 'ordens'), {
        cliente,
        descricao,
        status,
        criadoEm: serverTimestamp(),
      });

      alert('Ordem criada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      alert('Erro ao salvar a ordem. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-coal-black p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-cadmium-yellow mb-4">Nova OS</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cliente</label>
            <input
              type="text"
              className="w-full p-2 rounded-md bg-black/40 text-white border border-gray-600 focus:border-cadmium-yellow outline-none"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea
              className="w-full p-2 rounded-md bg-black/40 text-white border border-gray-600 focus:border-cadmium-yellow outline-none"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              className="w-full p-2 rounded-md bg-black/40 text-white border border-gray-600 focus:border-cadmium-yellow outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <
