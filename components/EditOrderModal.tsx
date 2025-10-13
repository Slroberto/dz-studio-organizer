import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

interface EditOrderModalProps {
  orderId: string;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ orderId, onClose }) => {
  const [cliente, setCliente] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('Aberta');
  const [salvando, setSalvando] = useState(false);

  // 🔹 Buscar os dados em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'ordens', orderId), (snapshot) => {
      const data = snapshot.data();
      if (data) {
        setCliente(data.cliente || '');
        setDescricao(data.descricao || '');
        setStatus(data.status || 'Aberta');
      }
    });
    return () => unsubscribe();
  }, [orderId]);

  // 🔹 Atualizar no Firestore
  const handleSalvar = async () => {
    try {
      setSalvando(true);
      const ref = doc(db, 'ordens', orderId);
      await updateDoc(ref, {
        cliente,
        descricao,
        status,
        atualizadoEm: new Date(),
      });
      alert('Ordem atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar a OS:', error);
      alert('Erro ao salvar alterações.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-coal-black p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-cadmium-yellow mb-4">Editar Ordem de Serviço</h2>

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
              <option value="Aberta">Aberta</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluída">Concluída</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-4 py-2 rounded-md bg-cadmium-yellow text-coal-black font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
