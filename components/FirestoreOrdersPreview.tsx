import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

type Ordem = {
  id: string;
  cliente?: string;
  descricao?: string;
  status?: string;
};

export function FirestoreOrdersPreview() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const snap = await getDocs(collection(db, "ordens"));
        const lista = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Ordem[];
        setOrdens(lista);
      } catch (e: any) {
        setErro(e?.message ?? "Erro ao ler Firestore");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2">Ordens do Firestore</h2>
      {loading && <p className="text-gray-400">Carregando...</p>}
      {erro && <p className="text-red-400">Erro: {erro}</p>}
      {!loading && !erro && ordens.length === 0 && (
        <p className="text-gray-400">Nenhuma ordem encontrada.</p>
      )}
      {!loading && !erro && ordens.length > 0 && (
        <ul className="space-y-2">
          {ordens.map((o) => (
            <li key={o.id} className="bg-black/20 p-3 rounded-lg border border-gray-700">
              <strong>{o.cliente ?? "Sem cliente"}</strong>, {o.descricao ?? "Sem descrição"} ({o.status ?? "Sem status"})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
