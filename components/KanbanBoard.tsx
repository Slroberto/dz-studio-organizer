import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

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

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const orderId = e.dataTransfer.getData("orderId");
    const orderRef = doc(db, "ordens", orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const renderColumn = (title: string, status: string, color: string) => {
    const filtered = orders.filter((o) => o.status === status);

    return (
      <div
        className="flex-1 p-3 bg-black/20 rounded-2xl border border-gray-700 min-h-[400px]"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <h2 className={`text-${color}-400 font-bold mb-3`}>{title}</h2>
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Nenhuma OS</p>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              draggable
              onDragStart={(e) => handleDragStart(e, order.id)}
              onClick={() => onSelectOrder(order)}
              className="bg-black/40 hover:bg-black/60 p-3 rounded-xl border border-gray-600 cursor-move transition-all mb-2"
            >
              <h3 className="font-semibold text-white">{order.cliente}</h3>
              <p className="text-gray-400 text-sm">{order.descricao}</p>
            </div>
          ))
        )}
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
