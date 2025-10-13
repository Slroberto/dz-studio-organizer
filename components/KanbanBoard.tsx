import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

interface ServiceOrder {
  id: string;
  cliente: string;
  descricao: string;
  status: string;
}

interface KanbanBoardProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onSelectOrder }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [newOrders, setNewOrders] = useState<{ [key: string]: string }>({
    Aberta: "",
    "Em andamento": "",
    Concluída: "",
  });
  const [saving, setSaving] = useState(false);

  // 🔄 Realtime sync com Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ordens"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceOrder[];
      setOrders(fetched);
    });
    return () => unsubscribe();
  }, []);

  // 🎯 Função de arrastar
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };

  // 💾 Atualiza status no Firestore
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const orderId = e.dataTransfer.getData("orderId");
    const orderRef = doc(db, "ordens", orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // ➕ Cria nova OS direto no Firestore
  const handleAddOrder = async (status: string) => {
    const descricao = newOrders[status].trim();
    if (!descricao) return alert("Digite uma descrição antes de salvar.");

    setSaving(true);
    try {
      await addDoc(collection(db, "ordens"), {
        cliente: "Novo Cliente",
        descricao,
        status,
        criadoEm: serverTimestamp(),
      });
      setNewOrders((prev) => ({ ...prev, [status]: "" }));
    } catch (err) {
      console.error("Erro ao criar OS:", err);
      alert("Erro ao salvar a nova OS.");
    } finally {
      setSaving(false);
    }
  };

  // 🧱 Renderiza cada coluna
  const renderColumn = (title: string, status: string, color: string) => {
    const filtered = orders.filter((o) => o.status === status);

    return (
      <div
        className="flex-1 p-3 bg-black/20 rounded-2xl border border-gray-700 min-h-[400px] flex flex-col"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <h2 className={`text-${color}-400 font-bold mb-3`}>{title}</h2>

        {/* Cards existentes */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Nenhuma OS</p>
          ) : (
            filtered.map((order) => (
              <div
                key={order.id}
                draggable
                onDragStart={(e) => handleDragStart(e, order.id)}
                onClick={() => onSelectOrder(order)}
                className="bg-black/40 hover:bg-black/60 p-3 rounded-xl border border-gray-600 cursor-move transition-all"
              >
                <h3 className="font-semibold text-white">{order.cliente}</h3>
                <p className="text-gray-400 text-sm">{order.descricao}</p>
              </div>
            ))
          )}
        </div>

        {/* Campo para nova OS */}
        <div className="mt-3 border-t border-gray-700 pt-3">
          <input
            type="text"
            placeholder="Descrição da nova OS..."
            className="w-full p-2 text-sm rounded-md bg-black/40 text-white border border-gray-600 focus:border-cadmium-yellow outline-none mb-2"
            value={newOrders[status]}
            onChange={(e) =>
              setNewOrders((prev) => ({ ...prev, [status]: e.target.value }))
            }
          />
          <button
            onClick={() => handleAddOrder(status)}
            disabled={saving}
            className="w-full py-1.5 text-sm bg-cadmium-yellow text-coal-black font-semibold rounded-md hover:brightness-110 disabled:opacity-50 transition"
          >
            {saving ? "Salvando..." : "+ Adicionar OS"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
      {renderColumn("Aberta", "Aberta", "cadmium-yellow")}
      {renderColumn("Em andamento", "Em andamento", "blue")}
      {renderColumn("Concluída", "Concluída", "green")}
    </div>
  );
};
