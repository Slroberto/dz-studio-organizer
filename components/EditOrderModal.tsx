import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ServiceOrder, OrderStatus, NotificationColorType, Task, Comment, UserRole, CustomFieldDefinition, CustomFieldType, InvoiceStatus } from '../types';
import { useAppContext } from './AppContext';
import { Loader, UploadCloud, File, ExternalLink, Trash2, AlertTriangle, ImagePlus, ListTodo, MessageSquare, Info, Send, CheckSquare, Plus, ChevronDown, CheckCircle, AlertCircle, Share2, Copy, TrendingUp, DollarSign, Receipt, Download } from 'lucide-react';
import { generateInvoicePDF } from '../services/pdfService';

interface EditOrderModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

type ModalTab = 'details' | 'tasks' | 'comments' | 'portal' | 'files' | 'faturamento';
type AutoSaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 md:px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
      isActive
        ? 'text-cadmium-yellow border-cadmium-yellow'
        : 'text-granite-gray-light border-transparent hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-2 hidden md:inline">{label}</span>
  </button>
);

const RenderCustomField: React.FC<{
  field: CustomFieldDefinition,
  value: any,
  onChange: (fieldId: string, value: any, type: CustomFieldType) => void
}> = ({ field, value, onChange }) => {
    switch (field.type) {
        case 'text':
            return <input type="text" value={value || ''} onChange={e => onChange(field.id, e.target.value, field.type)} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />;
        case 'number':
            return <input type="number" value={value || ''} onChange={e => onChange(field.id, e.target.value, field.type)} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />;
        case 'date':
            return <input type="date" value={(value || '').split('T')[0]} onChange={e => onChange(field.id, e.target.value, field.type)} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />;
        case 'boolean':
            return <div className="flex items-center h-10"><input type="checkbox" checked={!!value} onChange={e => onChange(field.id, e.target.checked, field.type)} className="w-5 h-5 rounded bg-black/30 border-granite-gray-light text-cadmium-yellow focus:ring-cadmium-yellow" /></div>;
        default:
            return null;
    }
};


export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose }) => {
  const {
    orders,
    users,
    kanbanColumns,
    customFieldDefinitions,
    updateOrder, isDataLoading, addNotification, currentUser,
    addTask, updateTask, deleteTask, addComment, generateShareableLink,
    generateInvoice, updateInvoiceStatus
  } = useAppContext();

  const currentOrderFromContext = orders.find(o => o.id === order.id) || order;
  
  const [formData, setFormData] = useState<ServiceOrder>(currentOrderFromContext);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [newTaskText, setNewTaskText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const commentListRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStateRef = useRef<ServiceOrder>(currentOrderFromContext);

  const isAdmin = currentUser?.role === UserRole.Admin;
  
  useEffect(() => {
    if (currentOrderFromContext.shareableToken) {
        setShareLink(`${window.location.origin}/portal/${currentOrderFromContext.shareableToken}`);
    }
  }, [currentOrderFromContext.shareableToken]);

  useEffect(() => {
    // Keep the form data in sync if the context provides a newer version of the order,
    // but only if the modal isn't currently saving, to avoid race conditions.
    const contextOrder = orders.find(o => o.id === order.id);
    if (contextOrder && JSON.stringify(contextOrder) !== JSON.stringify(formData) && autoSaveStatus !== 'saving') {
      setFormData(contextOrder);
      savedStateRef.current = contextOrder;
    }
  }, [orders, order.id]);

  // --- Auto-Save Logic ---
  useEffect(() => {
    // Only auto-save if the data has actually changed from the last saved state
    if (JSON.stringify(formData) === JSON.stringify(savedStateRef.current)) {
      return;
    }

    setAutoSaveStatus('typing');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await updateOrder(formData);
        savedStateRef.current = formData; // Update the reference state to the new saved state
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000); // Hide the 'saved' message after a bit
      } catch (error) {
        console.error("Auto-save failed:", error);
        setAutoSaveStatus('error');
      }
    }, 1500); // 1.5-second debounce delay

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [formData, updateOrder]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'date') {
        const date = new Date(value);
        date.setHours(12);
        setFormData(prev => ({ ...prev, [name]: date.toISOString() }));
    } else {
        const parsedValue = name === 'value' || name === 'costs' || name === 'imageCount' || name === 'progress'
            ? parseFloat(value) || 0
            : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: any, type: CustomFieldType) => {
    let processedValue = value;
    if (type === 'number') {
        processedValue = parseFloat(value as string) || 0;
    } else if (type === 'date' && value) {
        const date = new Date(value as string);
        date.setHours(12); // avoid timezone issues
        processedValue = date.toISOString();
    }
    setFormData(prev => ({
        ...prev,
        customFields: {
            ...(prev.customFields || {}),
            [fieldId]: processedValue,
        }
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    const deliveredColumn = kanbanColumns.find(c => c.status === 'Entregue');
    const columnsForProgress = kanbanColumns.filter(c => c.status !== 'Entregue');
    const columnIndex = columnsForProgress.findIndex(c => c.status === newStatus);
    
    let newProgress = 0;
    if (newStatus === 'Entregue') {
      newProgress = 100;
    } else if (columnIndex !== -1 && columnsForProgress.length > 0) {
      newProgress = Math.round(((columnIndex + 1) / columnsForProgress.length) * 99);
    }
    
    setFormData(prev => ({ 
        ...prev, 
        status: newStatus, 
        progress: newProgress,
        ...(newStatus === 'Entregue' && !prev.deliveryDate && { deliveryDate: new Date().toISOString() })
    }));
  };

  const handleSubmitAndClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // If there were changes, save them immediately before closing
    if (JSON.stringify(formData) !== JSON.stringify(savedStateRef.current)) {
        await updateOrder(formData);
    }
    onClose();
  };

  const handleAddTask = async () => {
    if (newTaskText.trim()) {
      await addTask(order.id, newTaskText.trim());
      setNewTaskText('');
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
      const taskToUpdate = formData.tasks?.find(t => t.id === taskId);
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

  const handleGenerateLink = async () => {
    const link = await generateShareableLink(order.id);
    setShareLink(link);
    addNotification({ message: 'Link do portal gerado com sucesso!', type: NotificationColorType.Success });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    addNotification({ message: 'Link copiado para a área de transferência!', type: NotificationColorType.Success });
  };

  useEffect(() => {
    if (activeTab === 'comments' && commentListRef.current) {
      commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
    }
  }, [formData.comments, activeTab]);

  const financials = useMemo(() => {
    const value = formData.value || 0;
    const costs = formData.costs || 0;
    const profit = value - costs;
    const margin = value > 0 ? (profit / value) * 100 : 0;
    return { profit, margin };
  }, [formData.value, formData.costs]);

  const renderAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
        case 'saving':
            return <div className="flex items-center text-sm text-yellow-400"><Loader size={16} className="animate-spin mr-2" /> Salvando...</div>;
        case 'saved':
            return <div className="flex items-center text-sm text-green-400"><CheckCircle size={16} className="mr-2" /> Salvo</div>;
        case 'error':
            return <div className="flex items-center text-sm text-red-400"><AlertCircle size={16} className="mr-2" /> Erro ao salvar</div>;
        case 'typing':
            return <div className="flex items-center text-sm text-granite-gray-light">Alterações pendentes...</div>;
        default:
            return null;
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation p-4"
        onClick={onClose}
    >
      <div 
        className="bg-coal-black rounded-xl p-6 md:p-8 w-full max-w-sm md:max-w-2xl lg:max-w-4xl border border-granite-gray/20 shadow-2xl flex flex-col h-[95vh] md:h-[90vh] modal-content-animation"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-4">
             <h2 className="text-xl md:text-2xl font-bold font-display">Editar Ordem de Serviço</h2>
             <div className="flex items-center space-x-4 self-end">
                 <div className="min-w-[150px] text-right">{renderAutoSaveIndicator()}</div>
                 <button type="button" onClick={onClose} disabled={isDataLoading} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors">Cancelar</button>
                 <button onClick={handleSubmitAndClose} disabled={autoSaveStatus === 'saving'} className="px-6 py-2 w-28 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95 disabled:opacity-50">
                   {autoSaveStatus === 'saving' ? <Loader size={18} className="animate-spin mx-auto"/> : 'Salvar'}
                 </button>
            </div>
        </div>

        <div className="flex-shrink-0 border-b border-granite-gray/20 mt-4">
            <TabButton icon={<Info size={16} />} label="Detalhes" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
            <TabButton icon={<ListTodo size={16} />} label="Tarefas" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
            <TabButton icon={<MessageSquare size={16} />} label="Comentários" isActive={activeTab === 'comments'} onClick={() => setActiveTab('comments')} />
            {isAdmin && <TabButton icon={<Receipt size={16} />} label="Faturamento" isActive={activeTab === 'faturamento'} onClick={() => setActiveTab('faturamento')} />}
            <TabButton icon={<Share2 size={16} />} label="Portal" isActive={activeTab === 'portal'} onClick={() => setActiveTab('portal')} />
            <TabButton icon={<File size={16} />} label="Arquivos" isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} />
        </div>
        
        <div className="flex-1 overflow-y-auto mt-6 pr-1">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <div className="lg:col-span-3">
                        <label htmlFor="client" className="block text-sm font-medium text-granite-gray-light mb-1">Cliente</label>
                        <input type="text" name="client" id="client" value={formData.client} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required />
                    </div>
                    <div>
                        <label htmlFor="orderNumber" className="block text-sm font-medium text-granite-gray-light mb-1">Número da OS</label>
                        <input type="text" name="orderNumber" id="orderNumber" value={formData.orderNumber} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-granite-gray-light mb-1">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleStatusChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow">
                            {kanbanColumns.map(col => <option key={col.status} value={col.status}>{col.title}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="responsible" className="block text-sm font-medium text-granite-gray-light mb-1">Responsável</label>
                        <div className="relative">
                            <select
                                name="responsible"
                                id="responsible"
                                value={formData.responsible || ''}
                                onChange={handleInputChange}
                                className="w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-3 pr-8 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                            >
                                <option value="">Não atribuído</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-3">
                        <label htmlFor="description" className="block text-sm font-medium text-granite-gray-light mb-1">Descrição</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required />
                    </div>
                   
                    <div>
                        <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-granite-gray-light mb-1">Previsão Entrega</label>
                        <input type="date" name="expectedDeliveryDate" id="expectedDeliveryDate" value={formData.expectedDeliveryDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                    </div>
                    <div>
                        <label htmlFor="deliveryDate" className="block text-sm font-medium text-granite-gray-light mb-1">Data de Entrega</label>
                        <input type="date" name="deliveryDate" id="deliveryDate" value={formData.deliveryDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                    </div>
                </div>

                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-granite-gray/20">
                      <h3 className="text-lg font-semibold mb-2 text-gray-300">Financeiro</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 items-end">
                           <div>
                              <label htmlFor="value" className="block text-sm font-medium text-granite-gray-light mb-1">Valor (R$)</label>
                              <input type="number" name="value" id="value" value={formData.value || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                          </div>
                          <div>
                              <label htmlFor="costs" className="block text-sm font-medium text-granite-gray-light mb-1">Custos (R$)</label>
                              <input type="number" name="costs" id="costs" value={formData.costs || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                          </div>
                          <div className="p-3 bg-granite-gray/10 rounded-lg">
                              <div className="text-sm font-medium text-granite-gray-light flex items-center"><DollarSign size={14} className="mr-2"/> Lucro Bruto</div>
                              <div className="text-lg font-bold text-green-400">{financials.profit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>
                          </div>
                          <div className="p-3 bg-granite-gray/10 rounded-lg">
                              <div className="text-sm font-medium text-granite-gray-light flex items-center"><TrendingUp size={14} className="mr-2"/> Margem</div>
                              <div className="text-lg font-bold text-green-400">{financials.margin.toFixed(1)}%</div>
                          </div>
                       </div>
                  </div>
                )}


                {customFieldDefinitions.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-granite-gray/20">
                      <h3 className="text-lg font-semibold mb-2 text-gray-300">Informações Adicionais</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {customFieldDefinitions.map(field => (
                          <div key={field.id}>
                            <label htmlFor={field.id} className="block text-sm font-medium text-granite-gray-light mb-1">{field.name}</label>
                            <RenderCustomField
                              field={field}
                              value={formData.customFields?.[field.id]}
                              onChange={handleCustomFieldChange}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                )}
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                        placeholder="Adicionar nova tarefa..."
                        className="flex-grow bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                    />
                    <button onClick={handleAddTask} className="p-2 bg-cadmium-yellow rounded-lg text-coal-black hover:brightness-110"><Plus size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {formData.tasks?.map(task => (
                      <div key={task.id} className="flex items-center p-2 bg-granite-gray/10 rounded-lg">
                          <input 
                            type="checkbox" 
                            checked={task.completed}
                            onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                            className="w-5 h-5 rounded bg-black/30 border-granite-gray-light text-cadmium-yellow focus:ring-cadmium-yellow"
                          />
                          <span className={`flex-grow ml-3 ${task.completed ? 'line-through text-granite-gray' : ''}`}>{task.text}</span>
                          <button onClick={() => handleDeleteTask(task.id)} className="text-granite-gray hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    ))}
                    {(!formData.tasks || formData.tasks.length === 0) && (
                        <div className="text-center py-8 text-granite-gray">
                            <CheckSquare size={32} className="mx-auto mb-2"/>
                            Nenhuma tarefa adicionada.
                        </div>
                    )}
                </div>
              </div>
            )}
            {activeTab === 'comments' && (
              <div className="flex flex-col h-full">
                <div ref={commentListRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                    {formData.comments?.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <img src={comment.userPicture} alt={comment.userName} className="w-8 h-8 rounded-full"/>
                            <div className="flex-1 bg-granite-gray/10 rounded-lg p-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-white">{comment.userName}</span>
                                    <span className="text-xs text-granite-gray">{new Date(comment.timestamp).toLocaleString('pt-BR')}</span>
                                </div>
                                <p className="text-gray-300 mt-1">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                     {(!formData.comments || formData.comments.length === 0) && (
                        <div className="text-center py-8 text-granite-gray">
                            <MessageSquare size={32} className="mx-auto mb-2"/>
                            Nenhum comentário ainda.
                        </div>
                    )}
                </div>
                 <div className="flex-shrink-0 flex items-center gap-2 pt-4 border-t border-granite-gray/20">
                    <textarea 
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Escreva um comentário..."
                        rows={1}
                        className="flex-grow bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                    />
                    <button onClick={handleAddComment} className="p-2 bg-cadmium-yellow rounded-lg text-coal-black hover:brightness-110"><Send size={20}/></button>
                </div>
              </div>
            )}
            {activeTab === 'faturamento' && (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                    {formData.invoice ? (
                        <div className="w-full max-w-lg bg-granite-gray/10 p-6 rounded-lg border border-granite-gray/20">
                            <h3 className="text-xl font-semibold text-gray-200 mb-4">Detalhes da Fatura</h3>
                            <div className="space-y-3 text-left">
                                <p><strong className="text-granite-gray-light w-28 inline-block">Número:</strong> <span className="font-mono text-white">{formData.invoice.invoiceNumber}</span></p>
                                <p><strong className="text-granite-gray-light w-28 inline-block">Emissão:</strong> {new Date(formData.invoice.issueDate).toLocaleDateString('pt-BR')}</p>
                                <p><strong className="text-granite-gray-light w-28 inline-block">Vencimento:</strong> {new Date(formData.invoice.dueDate).toLocaleDateString('pt-BR')}</p>
                                <div className="flex items-center">
                                    <strong className="text-granite-gray-light w-28 inline-block">Status:</strong>
                                    <select 
                                        value={formData.invoice.status}
                                        onChange={(e) => updateInvoiceStatus(order.id, e.target.value as InvoiceStatus)}
                                        className="bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                                    >
                                        {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={() => generateInvoicePDF(formData)}
                                className="mt-6 flex w-full items-center justify-center px-5 py-2.5 bg-granite-gray/30 text-white font-bold rounded-lg hover:bg-granite-gray/50 transition-colors"
                            >
                                <Download size={16} className="mr-2" /> Baixar PDF da Fatura
                            </button>
                        </div>
                    ) : (
                        <>
                            <Receipt size={48} className="mb-4 text-cadmium-yellow" />
                            <h3 className="text-xl font-semibold text-gray-200">Faturamento</h3>
                            <p className="max-w-md my-2 text-granite-gray">Esta OS ainda não possui uma fatura gerada. Gere uma fatura para controlar o pagamento.</p>
                            <button 
                                onClick={() => generateInvoice(order.id)}
                                className="mt-6 flex items-center justify-center px-5 py-2.5 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110 transition-transform transform active:scale-95"
                            >
                                Gerar Fatura
                            </button>
                        </>
                    )}
                </div>
            )}
             {activeTab === 'portal' && (
              <div className="w-full h-full flex flex-col items-center justify-center text-center text-granite-gray p-4">
                  <Share2 size={48} className="mb-4 text-cadmium-yellow" />
                  <h3 className="text-xl font-semibold text-gray-200">Portal do Cliente</h3>
                  <p className="max-w-md my-2">Gere um link seguro para compartilhar o progresso desta OS com seu cliente. Eles poderão ver o status atual e baixar os arquivos quando estiverem prontos.</p>
                  
                  {shareLink && (
                    <div className="w-full max-w-lg mt-6">
                        <label className="text-sm font-medium text-granite-gray-light mb-1 block">Link de Acesso do Cliente</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                readOnly
                                value={shareLink}
                                className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-400"
                            />
                            <button onClick={handleCopyLink} className="p-2.5 bg-cadmium-yellow/90 text-coal-black rounded-lg hover:bg-cadmium-yellow"><Copy size={18}/></button>
                        </div>
                    </div>
                  )}

                  <button 
                    onClick={handleGenerateLink}
                    className="mt-6 flex items-center justify-center px-5 py-2.5 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110 transition-transform transform active:scale-95"
                  >
                    {shareLink ? 'Gerar Novo Link' : 'Gerar Link de Acesso'}
                  </button>
                   {shareLink && <p className="text-xs text-granite-gray mt-2">Gerar um novo link invalidará o anterior.</p>}
              </div>
            )}
            {activeTab === 'files' && (
              <div className="w-full flex flex-col items-center justify-center h-full text-granite-gray">
                <File size={48} className="mb-4" />
                <h3 className="text-xl font-semibold text-gray-400">Gerenciamento de Arquivos</h3>
                <p>Esta funcionalidade será implementada em breve.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};