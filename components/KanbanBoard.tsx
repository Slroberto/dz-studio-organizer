import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Search } from "lucide-react";

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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | string>("Todos");

  // 🔄 Realtime Firestore sync
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

  // 🎯 Drag & drop
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const orderId = e.dataTransfer.getData("orderId");
    const orderRef = doc(db, "ordens", orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // ➕ Criação inline
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

  // 🧠 Filtro e busca
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.cliente.toLowerCase().includes(search.toLowerCase()) ||
        o.descricao.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "Todos" ? true : o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // 📊 Cálculos de contadores e progresso
  const total = orders.length;
  const abertas = orders.filter((o) => o.status === "Aberta").length;
  const andamento = orders.filter((o) => o.status === "Em andamento").length;
  const concluidas = orders.filter((o) => o.status === "Concluída").length;
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  // 🧱 Colunas
  const renderColumn = (title: string, status: string, color: string) => {
    const filtered = filteredOrders.filter((o) => o.status === status);

    return (
      <div
        className="flex-1 p-3 bg-black/20 rounded-2xl border border-gray-700 min-h-[400px] flex flex-col"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <h2 className={`text-${color}-400 font-bold mb-3`}>{title}</h2>

        {/* Cards */}
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
    <div className="flex flex-col gap-4 text-white">
      {/* 🔍 Barra de busca e filtros */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-700">
        <div className="relative w-full md:w-1/2">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por cliente ou descrição..."
            className="w-full pl-10 pr-3 py-2 rounded-md bg-black/40 border border-gray-600 focus:border-cadmium-yellow outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {["Todos", "Aberta", "Em andamento", "Concluída"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                statusFilter === s
                  ? "bg-cadmium-yellow text-coal-black"
                  : "bg-black/40 border border-gray-600 text-gray-300 hover:bg-black/60"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 📈 Painel de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
          <h3 className="text-cadmium-yellow text-sm font-medium mb-1">Total</h3>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>

        <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
          <h3 className="text-blue-400 text-sm font-medium mb-1">Em andamento</h3>
          <p className="text-3xl font-bold text-white">{andamento}</p>
        </div>

        <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
          <h3 className="text-cadmium-yellow text-sm font-medium mb-1">Abertas</h3>
          <p className="text-3xl font-bold text-white">{abertas}</p>
        </div>

        <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
          <h3 className="text-green-400 text-sm font-medium mb-1">Concluídas</h3>
          <p className="text-3xl font-bold text-white">{concluidas}</p>
          <div className="w-full bg-gray-700 h-2 mt-2 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-400 transition-all"
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-1">{progresso}% concluído</p>
        </div>
      </div>

      {/* 🧱 Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderColumn("Aberta", "Aberta", "cadmium-yellow")}
        {renderColumn("Em andamento", "Em andamento", "blue")}
        {renderColumn("Concluída", "Concluída", "green")}
      </div>
    </div>
  );
};
