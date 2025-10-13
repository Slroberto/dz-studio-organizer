import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AddOrderModalProps {
  onClose: () => void;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({ onClose }) => {
  const [cliente, setCliente] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('Aberta');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!cliente.trim() || !descricao.trim()) {
      alert('Por favor, preencha o cliente e a descrição.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'ordens'), {
        cliente,
        descricao,
        status,
        criadoEm: new Date().toISOString(),
      });

      alert('OS adicionada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      alert('Erro ao salvar OS. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-coal-black text-white p-6 rounded-2xl w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Nova OS</h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="bg-black/20 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="bg-black/20 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-black/20 border border-gray-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="Aberta">Aberta</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluída">Concluída</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
