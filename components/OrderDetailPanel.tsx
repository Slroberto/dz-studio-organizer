import React, { useState, useEffect, useRef } from 'react';
import { ServiceOrder, OrderStatus, UserRole, Task, Comment, KanbanColumn } from '../types';
import { useAppContext } from './AppContext';
import { X, Edit, Send, Plus, Trash2, CheckSquare, MessageSquare, Info, ChevronDown, StickyNote } from 'lucide-react';

interface OrderDetailPanelProps {
  order: ServiceOrder;
  onClose: () => void;
  onOpenFullEditor: (order: ServiceOrder) => void;
}

type PanelTab = 'details' | 'tasks' | 'comments';

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
      isActive
        ? 'text-cadmium-yellow border-cadmium-yellow'
        : 'text-granite-gray-light border-transparent hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);


export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({ order, onClose, onOpenFullEditor }) => {
    const { 
        orders, kanbanColumns, users, currentUser,
        updateOrder, addTask, updateTask, deleteTask, addComment 
    } = useAppContext();

    const currentOrderData = orders.find(o => o.id === order.id) || order;

    const [activeTab, setActiveTab] = useState<PanelTab>('details');
    const [newTaskText, setNewTaskText] = useState('');
    const [newCommentText, setNewCommentText] = useState('');
    const commentListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (activeTab === 'comments' && commentListRef.current) {
          commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
        }
    }, [currentOrderData.comments, activeTab]);

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!currentOrderData || currentOrderData.status === newStatus) return;

        const columnsForProgress = kanbanColumns.filter(c => c.status !== 'Entregue');
        const columnIndex = columnsForProgress.findIndex(c => c.status === newStatus);

        let progress = 0;
        if (newStatus === 'Entregue') {
          progress = 100;
        } else if (columnIndex !== -1 && columnsForProgress.length > 0) {
          progress = Math.round(((columnIndex + 1) / columnsForProgress.length) * 99);
        }

        const updatedOrder: ServiceOrder = {
            ...currentOrderData,
            status: newStatus,
            progress: progress,
            lastStatusUpdate: new Date().toISOString(),
            ...(newStatus === 'Entregue' && !currentOrderData.deliveryDate && { deliveryDate: new Date().toISOString() })
        };
        
        await updateOrder(updatedOrder);
    };
    
    const handleAddTask = async () => {
        if (newTaskText.trim()) {
          await addTask(order.id, newTaskText.trim());
          setNewTaskText('');
        }
    };

    const handleToggleTask = async (taskId: string, completed: boolean) => {
      const taskToUpdate = currentOrderData.tasks?.find(t => t.id === taskId);
      if (taskToUpdate) {
        await updateTask(order.id, { ...taskToUpdate, completed });
      }
    };
    
    const handleDeleteTask = async (taskId: string) => {
        await deleteTask(order.id, taskId);
    };
      
    const handleAddComment = async () => {
        if (newCommentText.trim() && currentUser) {
            await addComment(order.id, newCommentText.trim());
            setNewCommentText('');
        }
    };


    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 panel-backdrop-animation" onClick={onClose}></div>
            <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-coal-black shadow-2xl border-l border-granite-gray/20 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-granite-gray/20">
                    <div className="flex items-center gap-3">
                         <div className="relative">
                            <select
                                value={currentOrderData.status}
                                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                                className="appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-3 pr-8 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                            >
                                {kanbanColumns.map(col => <option key={col.status} value={col.status}>{col.title}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onOpenFullEditor(order)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-300 bg-granite-gray/20 rounded-lg hover:bg-granite-gray/40">
                            <Edit size={14} /> Abrir Editor Completo
                        </button>
                        <button onClick={onClose} className="p-2 text-granite-gray-light rounded-full hover:bg-granite-gray/20"><X size={20} /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4">
                        <h2 className="text-xl font-bold text-white">{currentOrderData.client}</h2>
                        <p className="text-sm text-granite-gray-light font-medium">{currentOrderData.orderNumber}</p>
                    </div>

                     <div className="flex-shrink-0 border-b border-granite-gray/20 mt-4 px-4">
                        <TabButton icon={<Info size={16} />} label="Detalhes" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                        <TabButton icon={<CheckSquare size={16} />} label="Tarefas" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
                        <TabButton icon={<MessageSquare size={16} />} label="Comentários" isActive={activeTab === 'comments'} onClick={() => setActiveTab('comments')} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'details' && (
                            <div className="space-y-4 text-sm">
                                <p className="text-gray-300 whitespace-pre-wrap">{currentOrderData.description}</p>
                                
                                {currentOrderData.notes && (
                                    <div className="mt-4 p-3 bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg">
                                        <h4 className="font-bold text-yellow-300 flex items-center gap-2 mb-1"><StickyNote size={16}/> Anotação Interna</h4>
                                        <p className="text-yellow-100/90 whitespace-pre-wrap">{currentOrderData.notes}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-granite-gray/20">
                                    <div><strong className="block text-granite-gray-light">Responsável:</strong> {currentOrderData.responsible || 'N/A'}</div>
                                    <div><strong className="block text-granite-gray-light">Previsão:</strong> {currentOrderData.expectedDeliveryDate ? new Date(currentOrderData.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                                    <div><strong className="block text-granite-gray-light">Qtd. Imagens:</strong> {currentOrderData.imageCount || 0}</div>
                                    <div><strong className="block text-granite-gray-light">Valor:</strong> {currentOrderData.value ? currentOrderData.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'N/A'}</div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'tasks' && (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {currentOrderData.tasks?.map(task => (
                                    <div key={task.id} className="flex items-center p-2 bg-granite-gray/10 rounded-lg group">
                                        <input type="checkbox" checked={task.completed} onChange={(e) => handleToggleTask(task.id, e.target.checked)} className="w-5 h-5 rounded bg-black/30 border-granite-gray-light text-cadmium-yellow focus:ring-cadmium-yellow" />
                                        <span className={`flex-grow ml-3 ${task.completed ? 'line-through text-granite-gray' : 'text-gray-200'}`}>{task.text}</span>
                                        <button onClick={() => handleDeleteTask(task.id)} className="text-granite-gray opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                    ))}
                                    {(!currentOrderData.tasks || currentOrderData.tasks.length === 0) && <div className="text-center py-8 text-granite-gray">Nenhuma tarefa.</div>}
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2 pt-4 border-t border-granite-gray/20">
                                    <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} placeholder="Adicionar nova tarefa..." className="flex-grow bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-sm text-gray-200"/>
                                    <button onClick={handleAddTask} className="p-2 bg-cadmium-yellow rounded-lg text-coal-black hover:brightness-110"><Plus size={20}/></button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'comments' && (
                            <div className="flex flex-col h-full">
                                <div ref={commentListRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                                    {currentOrderData.comments?.map(comment => (
                                        <div key={comment.id} className="flex items-start gap-3">
                                            <img src={comment.userPicture} alt={comment.userName} className="w-8 h-8 rounded-full"/>
                                            <div className="flex-1 bg-granite-gray/10 rounded-lg p-3">
                                                <div className="flex items-baseline gap-2"><span className="font-semibold text-white">{comment.userName}</span><span className="text-xs text-granite-gray">{new Date(comment.timestamp).toLocaleString('pt-BR')}</span></div>
                                                <p className="text-gray-300 mt-1 text-sm">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!currentOrderData.comments || currentOrderData.comments.length === 0) && <div className="text-center py-8 text-granite-gray">Nenhum comentário.</div>}
                                </div>
                                 <div className="flex-shrink-0 flex items-center gap-2 pt-4 border-t border-granite-gray/20">
                                    <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Escreva um comentário..." rows={2} className="flex-grow bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-sm text-gray-200"/>
                                    <button onClick={handleAddComment} className="p-2 bg-cadmium-yellow rounded-lg text-coal-black hover:brightness-110"><Send size={20}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};