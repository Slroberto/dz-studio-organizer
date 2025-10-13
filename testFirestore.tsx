import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function TestFirestore() {
  const [ordens, setOrdens] = useState<any[]>([]);

  useEffect(() => {
    const carregarOrdens = async () => {
      const snapshot = await getDocs(collection(db, "ordens"));
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrdens(lista);
    };
    carregarOrdens();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Ordens do Firestore</h2>
      {ordens.length === 0 ? (
        <p>Nenhuma ordem encontrada.</p>
      ) : (
        <ul>
          {ordens.map((ordem) => (
            <li key={ordem.id}>
              <strong>{ordem.cliente}</strong> — {ordem.descricao} ({ordem.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

