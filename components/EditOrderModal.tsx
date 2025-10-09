import React, { useState, useEffect, useCallback } from 'react';
import { ServiceOrder, OrderStatus, NotificationColorType } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { useAppContext } from './AppContext';
import { getFilesInFolder, uploadFile } from '../api/drive';
import { Loader, UploadCloud, File, ExternalLink, Trash2, AlertTriangle, ImagePlus } from 'lucide-react';

interface DriveFile {
    id: string;
    name: string;
    webViewLink: string;
    iconLink: string;
    thumbnailLink?: string;
    createdTime: string;
}

interface EditOrderModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose }) => {
  const { updateOrder, isDataLoading, addNotification } = useAppContext();
  const [formData, setFormData] = useState<ServiceOrder>(order);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  const getFolderIdFromLink = (link?: string) => {
    if (!link) return null;
    const match = link.match(/folders\/(.*?)(?:\?|$)/);
    return match ? match[1] : null;
  };

  const folderId = getFolderIdFromLink(order.link);

  const fetchDriveFiles = useCallback(async () => {
    if (!folderId) return;
    setIsFilesLoading(true);
    try {
        const files = await getFilesInFolder(folderId);
        setDriveFiles(files);
    } catch (error) {
        console.error("Failed to fetch drive files:", error);
    } finally {
        setIsFilesLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    setFormData(order);
    fetchDriveFiles();
  }, [order, fetchDriveFiles]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
        e.dataTransfer.clearData();
    }
  }

  const handleUpload = async (files: FileList | null) => {
     if (!files || files.length === 0 || !folderId) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
        await Promise.all(Array.from(files).map(file => 
            uploadFile(folderId, file, (progress) => {
                setUploadProgress(progress * 100);
            })
        ));
        addNotification({
            message: `Upload de ${files.length} arquivo(s) concluído.`,
            type: NotificationColorType.Success,
        });
        // Refresh file list after upload
        await fetchDriveFiles();
    } catch (error) {
        console.error("Upload failed:", error);
        addNotification({
            message: 'Falha no upload do arquivo',
            details: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
            type: NotificationColorType.Alert,
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'date') {
        const date = new Date(value);
        date.setHours(12); // Avoid timezone issues by setting time to midday
        setFormData(prev => ({ ...prev, [name]: date.toISOString() }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    const columnIndex = KANBAN_COLUMNS.findIndex(c => c.status === newStatus);
    const newProgress = Math.round((columnIndex / (KANBAN_COLUMNS.length - 1)) * 100);
    
    setFormData(prev => ({ 
        ...prev, 
        status: newStatus, 
        progress: newProgress,
        ...(newStatus === OrderStatus.Delivered && !prev.deliveryDate && { deliveryDate: new Date().toISOString() })
    }));
  };

  const handleSetThumbnail = (file: DriveFile) => {
    // Google Drive API thumbnailLinks can be size-specific. Replace the size parameter for a larger image.
    const biggerThumbnail = file.thumbnailLink?.replace('=s220', '=w400');
    if (biggerThumbnail) {
        setFormData(prev => ({ ...prev, thumbnailUrl: biggerThumbnail }));
        addNotification({
            message: 'Miniatura atualizada.',
            details: `Usando a imagem: ${file.name}`,
            type: NotificationColorType.Success,
        });
    } else {
         addNotification({
            message: 'Não foi possível usar esta imagem.',
            details: 'O arquivo pode não ter uma miniatura disponível.',
            type: NotificationColorType.Warning,
        });
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrder(formData);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation"
        onClick={onClose}
    >
      <div 
        className="bg-coal-black rounded-xl p-8 w-full max-w-4xl border border-granite-gray/20 shadow-2xl flex flex-col h-[90vh] modal-content-animation"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0">
             <h2 className="text-2xl font-bold mb-6 font-display">Editar Ordem de Serviço</h2>
        </div>
        <div className="flex-1 flex gap-8 overflow-hidden">
            <form onSubmit={handleSubmit} className="w-1/2 flex flex-col">
                <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-granite-gray-light mb-1">Cliente</label>
                        <input type="text" name="client" id="client" value={formData.client} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="orderNumber" className="block text-sm font-medium text-granite-gray-light mb-1">Número da OS</label>
                            <input type="text" name="orderNumber" id="orderNumber" value={formData.orderNumber} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required />
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-granite-gray-light mb-1">Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleStatusChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow">
                                {KANBAN_COLUMNS.map(col => <option key={col.status} value={col.status}>{col.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-granite-gray-light mb-1">Descrição</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="responsible" className="block text-sm font-medium text-granite-gray-light mb-1">Responsável</label>
                            <input type="text" name="responsible" id="responsible" value={formData.responsible || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                        </div>
                         <div>
                            <label htmlFor="progress" className="block text-sm font-medium text-granite-gray-light mb-1">Progresso (%)</label>
                            <input type="number" name="progress" id="progress" value={formData.progress} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-granite-gray-light mb-1">Previsão Entrega</label>
                            <input type="date" name="expectedDeliveryDate" id="expectedDeliveryDate" value={formData.expectedDeliveryDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                        </div>
                         <div>
                            <label htmlFor="deliveryDate" className="block text-sm font-medium text-granite-gray-light mb-1">Data de Entrega</label>
                            <input type="date" name="deliveryDate" id="deliveryDate" value={formData.deliveryDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-granite-gray-light mb-1">URL da Miniatura</label>
                        <input type="text" name="thumbnailUrl" id="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleInputChange} className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow" />
                        {formData.thumbnailUrl && (
                            <div className="mt-2">
                                <img src={formData.thumbnailUrl} alt="Pré-visualização da miniatura" className="rounded-md w-full aspect-video object-cover border border-granite-gray/50"/>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex-shrink-0 flex justify-end space-x-4 pt-6 mt-4 border-t border-granite-gray/20">
                    <button type="button" onClick={onClose} disabled={isDataLoading} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isDataLoading} className="px-6 py-2 w-28 bg-cadmium-yellow rounded-lg text-sm font-bold text-coal-black hover:brightness-110 transition-transform transform active:scale-95 disabled:opacity-50">
                      {isDataLoading ? <Loader size={18} className="animate-spin mx-auto"/> : 'Salvar'}
                    </button>
                </div>
            </form>
            <div className="w-1/2 flex flex-col bg-black/20 rounded-lg p-4">
                <div className="flex-shrink-0 flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Arquivos do Drive</h3>
                    {order.link && (
                        <a href={order.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-cadmium-yellow hover:underline">
                            Abrir no Drive <ExternalLink size={12} className="ml-1" />
                        </a>
                    )}
                </div>

                {folderId ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                         <div
                            onDrop={handleFileDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="relative flex-shrink-0 border-2 border-dashed border-granite-gray/50 rounded-lg p-4 text-center mb-4 hover:border-cadmium-yellow transition-colors"
                        >
                            <input type="file" multiple onChange={(e) => handleUpload(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <UploadCloud size={24} className="mx-auto text-granite-gray-light" />
                            <p className="text-sm text-granite-gray-light mt-1">Arraste arquivos ou clique para fazer upload</p>
                        </div>

                        {isUploading && (
                             <div className="w-full bg-granite-gray/20 rounded-full h-2 my-2">
                                <div className="bg-cadmium-yellow h-2 rounded-full" style={{width: `${uploadProgress}%`}}></div>
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-y-auto">
                           {isFilesLoading ? <Loader className="animate-spin mx-auto mt-4 text-cadmium-yellow"/> : (
                                driveFiles.length > 0 ? (
                                    <ul className="space-y-2">
                                        {driveFiles.map(file => (
                                            <li key={file.id} className="flex items-center p-2 bg-granite-gray/10 rounded">
                                                <img src={file.iconLink} alt="file type" className="w-4 h-4 mr-3" />
                                                <span className="flex-1 text-sm truncate">{file.name}</span>
                                                {file.thumbnailLink && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleSetThumbnail(file)}
                                                        className="p-1 text-granite-gray-light hover:text-cadmium-yellow"
                                                        title="Definir como miniatura"
                                                    >
                                                        <ImagePlus size={14}/>
                                                    </button>
                                                )}
                                                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="p-1 text-granite-gray-light hover:text-white"><ExternalLink size={14}/></a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-sm text-granite-gray-light py-4">Nenhum arquivo encontrado.</p>
                                )
                           )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center bg-black/10 rounded-lg">
                        <AlertTriangle size={32} className="text-yellow-500 mb-2" />
                        <p className="text-sm text-yellow-300">Link do Drive não encontrado.</p>
                        <p className="text-xs text-granite-gray-light">A pasta pode não ter sido criada corretamente.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
