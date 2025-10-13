import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Ordem {
  id: string;
  cliente: string;
  descricao: string;
  status: string;
}

export const FirestoreOrdersPreview: React.FC = () => {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ordens'), orderBy('criadoEm', 'desc'));
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
        Carregando ordens do Firestore...
      </div>
    );
  }

  if (ordens.length === 0) {
    return (
      <div className="text-gray-400 text-center mt-8">
        Nenhuma ordem encontrada.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-cadmium-yellow">Ordens do Firestore</h2>
      <ul className="space-y-3">
        {ordens.map((ordem) => (
          <li
            key={ordem.id}
            className="bg-black/20 border border-gray-700 rounded-lg p-4 hover:bg-black/30 transition"
          >
            <p className="text-white font-semibold">
              {ordem.cliente} — {ordem.descricao}{' '}
              <span className="text-cadmium-yellow">({ordem.status})</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
