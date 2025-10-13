import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceOrder, OrderStatus, NotificationColorType, Task, Comment, UserRole, StoredFile } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { useAppContext } from './AppContext';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Loader, UploadCloud, File, Trash2, ImagePlus, ListTodo, MessageSquare, Info, Send, ChevronDown, CheckCircle, AlertCircle, Download, Film } from 'lucide-react';


interface EditOrderModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

type ModalTab = 'details' | 'tasks' | 'comments' | 'files';
type AutoSaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';
interface UploadProgress {
    [fileName: string]: number;
}


const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ icon, label, isActive, onClick, count }) => (
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
    {count !== undefined && count > 0 && <span className="ml-2 bg-gray-700 text-xs font-bold rounded-full px-2 py-0.5">{count}</span>}
  </button>
);


const FileIcon = ({ mimeType }: { mimeType: string }) => {
    if (mimeType.startsWith('image/')) return <ImagePlus size={24} className="text-blue-400" />;
    if (mimeType.startsWith('video/')) return <Film size={24} className="text-purple-400" />;
    if (mimeType === 'application/pdf') return <File size={24} className="text-red-400" />;
    return <File size={24} className="text-gray-400" />;
};


export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose }) => {
  const {
    orders, users, updateOrder, isDataLoading, addNotification, currentUser,
    addTask, updateTask, deleteTask, addComment, addFileToOrder, deleteFileFromOrder
  } = useAppContext();

  const currentOrderFromContext = orders.find(o => o.id === order.id) || order;
  
  const [formData, setFormData] = useState<ServiceOrder>(currentOrderFromContext);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [newTaskText, setNewTaskText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  const commentListRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStateRef = useRef<ServiceOrder>(currentOrderFromContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === UserRole.Admin;

  const formatCommentTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'agora';
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const contextOrder = orders.find(o => o.id === order.id);
    if (contextOrder && JSON.stringify(contextOrder) !== JSON.stringify(savedStateRef.current) && autoSaveStatus !== 'saving') {
      setFormData(contextOrder);
      savedStateRef.current = contextOrder;
    }
  }, [orders, order.id, autoSaveStatus]);

  useEffect(() => {
    if (JSON.stringify(formData) === JSON.stringify(savedStateRef.current)) {
      setAutoSaveStatus('idle');
      return;
    }
    setAutoSaveStatus('typing');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await updateOrder(formData);
        savedStateRef.current = formData;
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setAutoSaveStatus('error');
      }
    }, 1500);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [formData, updateOrder]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'date' && value) {
        const date = new Date(value);
        date.setHours(12);
        processedValue = date.toISOString();
    } else if (type === 'number') {
        processedValue = parseFloat(value) || 0;
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    const columnIndex = KANBAN_COLUMNS.findIndex(c => c.status === newStatus);
    const newProgress = Math.round((columnIndex / (KANBAN_COLUMNS.length - 1)) * 100);
    setFormData(prev => ({ 
        ...prev, status: newStatus, progress: newProgress,
        ...(newStatus === OrderStatus.Delivered && !prev.deliveryDate && { deliveryDate: new Date().toISOString() })
    }));
  };

  const handleSubmitAndClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (JSON.stringify(formData) !== JSON.stringify(savedStateRef.current)) {
       await updateOrder(formData);
    }
    onClose();
  };

  const handleAddTask = () => { if (newTaskText.trim()) { addTask(order.id, newTaskText.trim()); setNewTaskText(''); } };
  const handleToggleTask = (taskId: string, completed: boolean) => { const task = formData.tasks?.find(t => t.id === taskId); if(task) updateTask(order.id, { ...task, completed }); };
  const handleDeleteTask = (taskId: string) => deleteTask(order.id, taskId);
  const handleAddComment = () => { if (newCommentText.trim() && currentUser) { addComment(order.id, newCommentText.trim()); setNewCommentText(''); } };

  useEffect(() => { if (activeTab === 'comments' && commentListRef.current) commentListRef.current.scrollTop = commentListRef.current.scrollHeight; }, [formData.comments, activeTab]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleUploadFiles(Array.from(e.target.files));
        }
    };

    const handleUploadFiles = (files: File[]) => {
        if (isUploading) return;
        setIsUploading(true);
        setUploadProgress({});

        const uploadPromises = files.map(file => {
            const filePath = `orders/${order.id}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise<void>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(prev => ({...prev, [file.name]: progress}));
                    },
                    (error) => { console.error(`Upload failed for ${file.name}:`, error); reject(error); },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        const newFile: StoredFile = {
                            name: file.name,
                            url: downloadURL,
                            type: file.type,
                            size: file.size,
                            path: filePath
                        };
                        await addFileToOrder(order.id, newFile);
                        resolve();
                    }
                );
            });
        });

        Promise.all(uploadPromises)
            .then(() => { addNotification({ message: 'Arquivos enviados com sucesso!', type: NotificationColorType.Success }); })
            .catch(() => { addNotification({ message: 'Ocorreu um erro no upload.', type: NotificationColorType.Alert }); })
            .finally(() => { setIsUploading(false); setUploadProgress({}); });
    };

    const handleDeleteFile = async (fileToDelete: StoredFile) => {
        if (window.confirm(`Tem certeza que deseja excluir o arquivo "${fileToDelete.name}"?`)) {
            try {
                const fileRef = ref(storage, fileToDelete.path);
                await deleteObject(fileRef);
                await deleteFileFromOrder(order.id, fileToDelete);
                addNotification({ message: 'Arquivo excluído.', type: NotificationColorType.Warning });
            } catch (error) {
                console.error("Error deleting file:", error);
                addNotification({ message: 'Erro ao excluir arquivo.', type: NotificationColorType.Alert });
            }
        }
    };

  const renderAutoSaveIndicator = () => {
    switch(autoSaveStatus) {
        case 'typing': return <span className="text-xs text-granite-gray-light">Digitando...</span>;
        case 'saving': return <div className="flex items-center text-xs text-cadmium-yellow"><Loader size={14} className="animate-spin mr-2" /> Salvando...</div>;
        case 'saved': return <div className="flex items-center text-xs text-green-400"><CheckCircle size={14} className="mr-2" /> Salvo</div>;
        case 'error': return <div className="flex items-center text-xs text-red-400"><AlertCircle size={14} className="mr-2" /> Erro</div>;
        default: return <span className="text-xs text-granite-gray"></span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation p-4" onClick={onClose}>
      <div className="bg-coal-black rounded-xl p-6 md:p-8 w-full max-w-sm md:max-w-2xl lg:max-w-4xl border border-granite-gray/20 shadow-2xl flex flex-col h-[95vh] md:h-[90vh] modal-content-animation" onClick={e => e.stopPropagation()}>
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
            <TabButton icon={<ListTodo size={16} />} label="Tarefas" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} count={formData.tasks?.length} />
            <TabButton icon={<MessageSquare size={16} />} label="Comentários" isActive={activeTab === 'comments'} onClick={() => setActiveTab('comments')} count={formData.comments?.length} />
            <TabButton icon={<File size={16} />} label="Arquivos" isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} count={formData.files?.length} />
        </div>
        
        <div className="flex-1 overflow-y-auto mt-6 pr-1">
            {activeTab === 'details' && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                 <div className="md:col-span-2"><label htmlFor="client" className="block text-sm font-medium text-granite-gray-light mb-1">Cliente</label><input type="text" name="client" id="client" value={formData.client} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required /></div>
                 <div><label htmlFor="orderNumber" className="block text-sm font-medium text-granite-gray-light mb-1">Número da OS</label><input type="text" name="orderNumber" id="orderNumber" value={formData.orderNumber} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required /></div>
                 <div><label htmlFor="status" className="block text-sm font-medium text-granite-gray-light mb-1">Status</label><select name="status" id="status" value={formData.status} onChange={handleStatusChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow">{KANBAN_COLUMNS.map(col => <option key={col.status} value={col.status}>{col.title}</option>)}</select></div>
                 <div className="md:col-span-2"><label htmlFor="description" className="block text-sm font-medium text-granite-gray-light mb-1">Descrição</label><textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required /></div>
                 <div className={!isAdmin ? 'md:col-span-2' : ''}><label htmlFor="responsible" className="block text-sm font-medium text-granite-gray-light mb-1">Responsável</label><div className="relative"><select name="responsible" id="responsible" value={formData.responsible || ''} onChange={handleInputChange} className="w-full appearance-none bg-black/30 border border-granite-gray/50 rounded-lg pl-3 pr-8 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"><option value="">Não atribuído</option>{users.map(user => (<option key={user.id} value={user.name}>{user.name} ({user.role})</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><ChevronDown size={18} /></div></div></div>
                 {isAdmin && (<div><label htmlFor="value" className="block text-sm font-medium text-granite-gray-light mb-1">Valor (R$)</label><input type="number" name="value" id="value" value={formData.value || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" /></div>)}
                 <div><label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-granite-gray-light mb-1">Previsão Entrega</label><input type="date" name="expectedDeliveryDate" id="expectedDeliveryDate" value={formData.expectedDeliveryDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" /></div>
                 <div><label htmlFor="deliveryDate" className="block text-sm font-medium text-granite-gray-light mb-1">Data de Entrega</label><input type="date" name="deliveryDate" id="deliveryDate" value={formData.deliveryDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" /></div>
            </div>)}
            {activeTab === 'tasks' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {(!formData.tasks || formData.tasks.length === 0) && (
                        <div className="text-center py-8 text-granite-gray"><ListTodo size={32} className="mx-auto mb-2"/>Nenhuma tarefa adicionada.</div>
                    )}
                    {formData.tasks?.map(task => (
                        <div key={task.id} className="flex items-center p-2 bg-granite-gray/10 rounded-lg group animate-fadeIn">
                            <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id, !task.completed)} className="w-5 h-5 rounded bg-black/30 border-granite-gray text-cadmium-yellow focus:ring-cadmium-yellow" />
                            <span className={`ml-3 flex-1 text-sm ${task.completed ? 'line-through text-granite-gray' : 'text-gray-200'}`}>{task.text}</span>
                            <button onClick={() => handleDeleteTask(task.id)} className="ml-4 p-1 text-granite-gray-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 mt-4 pt-4 border-t border-granite-gray/20">
                    <div className="flex gap-2">
                        <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} placeholder="Adicionar nova tarefa..." className="flex-1 bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                        <button onClick={handleAddTask} className="px-4 py-2 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110">Adicionar</button>
                    </div>
                </div>
              </div>
            )}
            {activeTab === 'comments' && (
              <div className="flex flex-col h-full">
                <div ref={commentListRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {(!formData.comments || formData.comments.length === 0) && (
                        <div className="text-center py-8 text-granite-gray"><MessageSquare size={32} className="mx-auto mb-2"/>Nenhum comentário. Inicie a conversa!</div>
                    )}
                    {formData.comments?.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(comment => (
                        <div key={comment.id} className="flex items-start gap-3 animate-fadeIn">
                            <img src={comment.userPicture || `https://i.pravatar.cc/150?u=${comment.userId}`} alt={comment.userName} className="w-8 h-8 rounded-full mt-1" />
                            <div className="flex-1 bg-granite-gray/10 p-3 rounded-lg">
                                <div className="flex items-baseline justify-between">
                                    <p className="font-semibold text-sm text-white">{comment.userName}</p>
                                    <p className="text-xs text-granite-gray-light">{formatCommentTimestamp(comment.timestamp)}</p>
                                </div>
                                <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 mt-4 pt-4 border-t border-granite-gray/20">
                    <div className="flex items-start gap-2">
                        <img src={currentUser?.picture} alt={currentUser?.name} className="w-8 h-8 rounded-full" />
                        <textarea value={newCommentText} onChange={e => setNewCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }} placeholder="Adicionar um comentário..." rows={2} className="flex-1 bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow resize-none" />
                        <button onClick={handleAddComment} className="p-2 h-full bg-cadmium-yellow rounded-lg text-coal-black hover:brightness-110 self-end"><Send size={18}/></button>
                    </div>
                </div>
              </div>
            )}
            {activeTab === 'files' && (
              <div className="flex flex-col h-full">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center justify-center w-full p-4 mb-4 border-2 border-dashed border-granite-gray/50 rounded-lg text-granite-gray-light hover:border-cadmium-yellow hover:text-cadmium-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <UploadCloud size={24} className="mr-3" />
                      <span>{isUploading ? 'Enviando...' : 'Adicionar Arquivos'}</span>
                  </button>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {isUploading && Object.entries(uploadProgress).map(([name, progress]) => (
                        <div key={name} className="p-2 bg-granite-gray/10 rounded-lg">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-gray-300 truncate">{name}</span>
                                {/* FIX: Cast 'progress' to number as its type is not correctly inferred. */}
                                <span className="font-semibold text-cadmium-yellow">{Math.round(progress as number)}%</span>
                            </div>
                            <div className="w-full bg-black/30 rounded-full h-1.5"><div className="bg-cadmium-yellow h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                        </div>
                    ))}
                    {(!formData.files || formData.files.length === 0) && !isUploading && (
                        <div className="text-center py-8 text-granite-gray"><File size={32} className="mx-auto mb-2"/>Nenhum arquivo adicionado.</div>
                    )}
                    {formData.files?.map(file => (
                        <div key={file.path} className="flex items-center p-2 bg-granite-gray/10 rounded-lg animate-fadeIn">
                           <FileIcon mimeType={file.type} />
                           <div className="ml-3 flex-1 min-w-0">
                               <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                               <p className="text-xs text-granite-gray-light">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                           </div>
                           <div className="flex items-center ml-4">
                               <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 text-granite-gray-light hover:text-cadmium-yellow" title="Baixar"><Download size={18}/></a>
                               <button onClick={() => handleDeleteFile(file)} className="p-2 text-granite-gray-light hover:text-red-500" title="Excluir"><Trash2 size={18}/></button>
                           </div>
                        </div>
                    ))}
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};