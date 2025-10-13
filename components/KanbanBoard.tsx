import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface Order {
  id: string;
  cliente: string;
  descricao: string;
  status: string;
}

export const KanbanBoard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const snapshot = await getDocs(collection(db, "ordens"));
      const fetched = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];
      setOrders(fetched);
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, "ordens", id), { status: newStatus });
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    pdf.text("Relatório de Ordens de Serviço", 14, 20);
    (pdf as any).autoTable({
      startY: 30,
      head: [["Cliente", "Descrição", "Status"]],
      body: orders.map((o) => [o.cliente, o.descricao, o.status]),
    });
    pdf.save("ordens.pdf");
  };

  const grouped = {
    Aberta: orders.filter((o) => o.status === "Aberta"),
    "Em Progresso": orders.filter((o) => o.status === "Em Progresso"),
    Concluída: orders.filter((o) => o.status === "Concluída"),
  };

  return (
    <div className="p-6 bg-coal-black min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-cadmium-yellow">
          Painel Kanban
        </h1>
        <button
          onClick={exportToPDF}
          className="bg-cadmium-yellow text-black px-4 py-2 rounded-md font-semibold hover:opacity-90"
        >
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {Object.entries(grouped).map(([status, items]) => (
          <div
            key={status}
            className="bg-black/40 rounded-lg p-4 border border-gray-700"
          >
            <h2 className="text-xl font-semibold text-cadmium-yellow mb-4">
              {status}
            </h2>
            {items.map((order) => (
              <div
                key={order.id}
                onClick={() =>
                  handleStatusChange(
                    order.id,
                    order.status === "Aberta"
                      ? "Em Progresso"
                      : order.status === "Em Progresso"
                      ? "Concluída"
                      : "Aberta"
                  )
                }
                className="bg-coal-black p-3 rounded-md mb-3 shadow-md cursor-pointer hover:bg-gray-800"
              >
                <h3 className="text-lg font-bold">{order.cliente}</h3>
                <p className="text-gray-400">{order.descricao}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
