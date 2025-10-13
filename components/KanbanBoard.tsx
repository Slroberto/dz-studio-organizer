import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Ordem {
  id: string;
  cliente: string;
  descricao: string;
  status: string;
}

export const KanbanBoard: React.FC<{ onSelectOrder: (ordem: Ordem) => void }> = ({ onSelectOrder }) => {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ordens'), orderBy('cliente'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Ordem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ordem[];

      setOrdens(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="text-gray-400 text-center mt-8 animate-pulse">
        Carregando Kanban...
      </div>
    );
  }

  // Agrupa por status
  const colunas = ['Aberta', 'Em andamento', 'Concluída'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {colunas.map((status) => (
        <div key={status} className="bg-black/30 rounded-xl border border-gray-700 p-4">
          <h3 className="text-cadmium-yellow text-lg font-bold mb-4">
            {status}
          </h3>

          {ordens
            .filter((ordem) => ordem.status === status)
            .map((ordem) => (
              <div
                key={ordem.id}
                onClick={() => onSelectOrder(ordem)}
                className="bg-black/40 border border-gray-600 rounded-lg p-4 mb-3 cursor-pointer hover:bg-black/60 transition"
              >
                <p className="font-semibold text-white">{ordem.cliente}</p>
                <p className="text-gray-400 text-sm">{ordem.descricao}</p>
              </div>
            ))}

          {ordens.filter((ordem) => ordem.status === status).length === 0 && (
            <p className="text-gray-500 text-sm text-center">Nenhuma OS</p>
          )}
        </div>
      ))}
    </div>
  );
};
