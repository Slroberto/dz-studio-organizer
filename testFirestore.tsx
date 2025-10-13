import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

export default function TestFirestore() {
  const [ordens, setOrdens] = useState<any[]>([]);

  const fetchOrdens = async () => {
    const querySnapshot = await getDocs(collection(db, "ordens"));
    setOrdens(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const addOrdem = async () => {
    await addDoc(collection(db, "ordens"), {
      cliente: "Novo Cliente",
      descricao: "OS criada pelo botão",
      status: "Aberta",
    });
    fetchOrdens();
  };

  useEffect(() => {
    fetchOrdens();
  }, []);

  return (
    <div style={{ padding: 20, background: "#111", color: "white" }}>
      <h2>Ordens do Firestore</h2>
      <button
        onClick={addOrdem}
        style={{
          background: "#DCFF00",
          color: "#111",
          border: "none",
          padding: "10px 16px",
          borderRadius: 8,
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        + Nova OS
      </button>

      {ordens.length === 0 ? (
        <p>Nenhuma ordem encontrada.</p>
      ) : (
        <ul>
          {ordens.map((ordem) => (
            <li key={ordem.id}>
              <strong>{ordem.cliente}</strong> — {ordem.descricao} (
              {ordem.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
