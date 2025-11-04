import React, { useState, useRef, useEffect } from 'react';
import { Settings, PlusCircle, Edit, Trash2, BookOpen, Save, Workflow, Type, Hash, Calendar, ToggleLeft, ListChecks, GripVertical, ChevronDown, Check } from 'lucide-react';
import { useAppContext } from './AppContext';
import { User, UserRole, CatalogServiceItem, KanbanColumn, CustomFieldDefinition, CustomFieldType } from '../types';
import { UserFormModal } from './UserFormModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ServiceItemFormModal } from './ServiceItemFormModal';


const roleColors: Record<UserRole, string> = {
    [UserRole.Admin]: 'bg-red-500/20 text-red-300 border-red-500/30',
    [UserRole.Assistant]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [UserRole.Viewer]: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

type EditableCustomField = CustomFieldDefinition & { _tempId: string };

const CustomFieldsSettings = () => {
    const { customFieldDefinitions, setCustomFieldDefinitions, addNotification } = useAppContext();
    const [editableFields, setEditableFields] = useState<EditableCustomField[]>(
      customFieldDefinitions.map(f => ({ ...f, _tempId: f.id }))
    );
    const [fieldToDelete, setFieldToDelete] = useState<EditableCustomField | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
    const dropdownContainerRef = useRef<HTMLDivElement>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (openDropdownId && dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [openDropdownId]);


    const typeOptions: { value: CustomFieldType; label: string; icon: React.ReactNode }[] = [
      { value: 'text', label: 'Texto', icon: <Type size={16} /> },
      { value: 'number', label: 'Número', icon: <Hash size={16} /> },
      { value: 'date', label: 'Data', icon: <Calendar size={16} /> },
      { value: 'boolean', label: 'Lógico (Sim/Não)', icon: <ToggleLeft size={16} /> },
    ];

    const handleFieldChange = (index: number, field: 'name' | 'type', value: string) => {
        const newFields = [...editableFields];
        newFields[index] = { ...newFields[index], [field]: value };
        setEditableFields(newFields);
    };

    const addField = () => {
        const newField: EditableCustomField = {
            id: `cf-${Date.now()}`,
            _tempId: `cf-temp-${Date.now()}`,
            name: 'Novo Campo',
            type: 'text'
        };
        setEditableFields([...editableFields, newField]);
    };

    const confirmDeleteField = () => {
        if (fieldToDelete) {
            setEditableFields(editableFields.filter(f => f._tempId !== fieldToDelete._tempId));
            setFieldToDelete(null);
        }
    };
    
    const saveChanges = () => {
        const finalFields = editableFields.map(({ _tempId, ...rest }) => rest);
        const names = finalFields.map(f => f.name.trim());
        if (new Set(names).size !== names.length) {
            addNotification({ message: 'Erro ao Salvar', details: 'Os nomes dos campos devem ser únicos.', type: 'alert' });
            return;
        }
        if (names.some(name => name === '')) {
            addNotification({ message: 'Erro ao Salvar', details: 'O nome do campo não pode estar vazio.', type: 'alert' });
            return;
        }

        setCustomFieldDefinitions(finalFields);
        addNotification({ message: 'Campos personalizados salvos com sucesso!', type: 'success' });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            return;
        }
        const newFields = [...editableFields];
        const draggedItemContent = newFields.splice(dragItem.current, 1)[0];
        newFields.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        setEditableFields(newFields);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        dragItem.current = null;
        dragOverItem.current = null;
    };


    const handleDropdownToggle = (e: React.MouseEvent<HTMLButtonElement>, fieldId: string) => {
        const dropdownHeight = 180; // Estimated height: 4 items * 44px
        const rect = e.currentTarget.getBoundingClientRect();

        // Check if there's not enough space below but enough space above
        if (window.innerHeight - rect.bottom < dropdownHeight && rect.top > dropdownHeight) {
            setDropdownDirection('up');
        } else {
            setDropdownDirection('down');
        }
        
        setOpenDropdownId(openDropdownId === fieldId ? null : fieldId);
    };

    return (
        <div className="bg-black/20 p-4 md:p-6 rounded-lg border border-granite-gray/20 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-3"><ListChecks size={24}/> Campos Personalizados (OS)</h2>
                <button onClick={saveChanges} className="flex items-center px-3 py-1.5 bg-cadmium-yellow/90 rounded-lg text-xs font-bold text-coal-black hover:bg-cadmium-yellow"><Save size={16} className="mr-2" />Salvar Campos</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                 {editableFields.map((field, index) => (
                    <div 
                        key={field._tempId} 
                        className="flex items-center gap-2 p-2 bg-granite-gray/10 rounded transition-opacity"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="cursor-grab active:cursor-grabbing p-1">
                           <GripVertical size={18} className="text-granite-gray-light flex-shrink-0" />
                        </div>
                        <input 
                            type="text" 
                            value={field.name}
                            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                            className="flex-grow bg-black/30 border border-granite-gray/50 rounded-md px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cadmium-yellow"
                        />
                         <div className="relative w-48" ref={openDropdownId === field._tempId ? dropdownContainerRef : null}>
                            <button
                                type="button"
                                onClick={(e) => handleDropdownToggle(e, field._tempId)}
                                className="w-full flex items-center justify-between bg-black/30 border border-granite-gray/50 rounded-md px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cadmium-yellow"
                                aria-haspopup="listbox"
                                aria-expanded={openDropdownId === field._tempId}
                            >
                                <div className="flex items-center gap-2">
                                    {typeOptions.find(o => o.value === field.type)?.icon}
                                    <span>{typeOptions.find(o => o.value === field.type)?.label}</span>
                                </div>
                                <ChevronDown size={16} className={`transition-transform ${openDropdownId === field._tempId ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdownId === field._tempId && (
                                <div className={`absolute w-full bg-coal-black border border-granite-gray/20 rounded-md shadow-lg z-10 p-1 ${dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`} role="listbox">
                                    {typeOptions.map(option => (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                handleFieldChange(index, 'type', option.value);
                                                setOpenDropdownId(null);
                                            }}
                                            className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer transition-colors duration-150 ${
                                                field.type === option.value
                                                    ? 'bg-cadmium-yellow/10 text-cadmium-yellow font-semibold'
                                                    : 'text-gray-300 hover:bg-granite-gray/30 hover:text-white'
                                            }`}
                                            role="option"
                                            aria-selected={field.type === option.value}
                                        >
                                            <div className="flex items-center gap-2">
                                                {option.icon}
                                                <span>{option.label}</span>
                                            </div>
                                            {field.type === option.value && <Check size={16} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setFieldToDelete(field)} className="p-2 text-granite-gray-light hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                ))}
                 <button onClick={addField} className="w-full flex items-center justify-center gap-2 p-2 text-sm font-semibold text-cadmium-yellow/80 hover:text-cadmium-yellow border-2 border-dashed border-granite-gray/30 rounded-lg hover:border-cadmium-yellow/50 transition-colors">
                    <PlusCircle size={16} /> Adicionar Campo
                </button>
            </div>
             {fieldToDelete && (
                <ConfirmDeleteModal
                    title="Confirmar Exclusão de Campo"
                    message={`Tem certeza que deseja excluir o campo "<strong>${fieldToDelete.name}</strong>"? Esta ação não removerá os dados já preenchidos nas OSs existentes, mas o campo não será mais visível.`}
                    onConfirm={confirmDeleteField}
                    onCancel={() => setFieldToDelete(null)}
                />
            )}
        </div>
    );
};

type EditableKanbanColumn = KanbanColumn & { _tempId: string };

const KanbanSettings = () => {
    const { kanbanColumns, setKanbanColumns, addNotification } = useAppContext();

    const [editableColumns, setEditableColumns] = useState<EditableKanbanColumn[]>(() =>
        kanbanColumns
            .filter(c => c.status !== 'Entregue')
            .map(c => ({ ...c, _tempId: `${c.status}-${Math.random()}` }))
    );
    const [columnToDelete, setColumnToDelete] = useState<EditableKanbanColumn | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleColumnChange = (index: number, field: 'title' | 'color', value: string) => {
        const newColumns = [...editableColumns];
        const currentColumn = newColumns[index];
        const updatedColumn = { 
            ...currentColumn, 
            [field]: value 
        };
        newColumns[index] = updatedColumn;
    
        // Keep a temporary unique ID for React keys, but update status based on title
        if (field === 'title') {
            updatedColumn.status = value.trim();
        }
    
        setEditableColumns(newColumns);
    };

    const addColumn = () => {
        const newColumn: EditableKanbanColumn = {
            title: 'Nova Etapa',
            status: `Nova Etapa`, 
            color: '#808080',
            _tempId: `col-${Date.now()}`
        };
        setEditableColumns([...editableColumns, newColumn]);
    };
    
    const confirmDeleteColumn = () => {
        if (columnToDelete) {
             setEditableColumns(editableColumns.filter(c => c._tempId !== columnToDelete._tempId));
             setColumnToDelete(null);
        }
    };

    const saveChanges = () => {
        const finalEditableColumns = editableColumns.map(col => ({
            title: col.title.trim(),
            status: col.title.trim(),
            color: col.color,
        }));

        const titles = finalEditableColumns.map(c => c.title);
        if (new Set(titles).size !== titles.length) {
            addNotification({ message: 'Erro ao Salvar', details: 'Os títulos das colunas devem ser únicos.', type: 'alert' });
            return;
        }
        
        const deliveredColumn = kanbanColumns.find(c => c.status === 'Entregue');
        const finalColumns = [...finalEditableColumns, ...(deliveredColumn ? [deliveredColumn] : [])];

        setKanbanColumns(finalColumns);
        addNotification({ message: 'Fluxo de trabalho salvo com sucesso!', type: 'success' });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            return;
        }
        const newColumns = [...editableColumns];
        const draggedItemContent = newColumns.splice(dragItem.current, 1)[0];
        newColumns.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        setEditableColumns(newColumns);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="bg-black/20 p-4 md:p-6 rounded-lg border border-granite-gray/20 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-3"><Workflow size={24}/> Fluxo de Trabalho (Kanban)</h2>
              <button onClick={saveChanges} className="flex items-center px-3 py-1.5 bg-cadmium-yellow/90 rounded-lg text-xs font-bold text-coal-black hover:bg-cadmium-yellow"><Save size={16} className="mr-2" />Salvar Fluxo</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {editableColumns.map((col, index) => (
                    <div 
                        key={col._tempId} 
                        className="flex items-center gap-2 p-2 bg-granite-gray/10 rounded transition-opacity"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="cursor-grab active:cursor-grabbing p-1">
                           <GripVertical size={18} className="text-granite-gray-light flex-shrink-0" />
                        </div>
                        <input 
                            type="color" 
                            value={col.color}
                            onChange={(e) => handleColumnChange(index, 'color', e.target.value)}
                            className="w-8 h-8 bg-transparent border-none cursor-pointer rounded"
                        />
                        <input 
                            type="text" 
                            value={col.title}
                            onChange={(e) => handleColumnChange(index, 'title', e.target.value)}
                            onBlur={() => { /* This can be used for on-the-fly validation if needed */ }}
                            className="flex-grow bg-black/30 border border-granite-gray/50 rounded-md px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cadmium-yellow"
                        />
                        <button onClick={() => setColumnToDelete(col)} className="p-2 text-granite-gray-light hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                ))}
                <button onClick={addColumn} className="w-full flex items-center justify-center gap-2 p-2 text-sm font-semibold text-cadmium-yellow/80 hover:text-cadmium-yellow border-2 border-dashed border-granite-gray/30 rounded-lg hover:border-cadmium-yellow/50 transition-colors">
                    <PlusCircle size={16} /> Adicionar Nova Coluna
                </button>
            </div>
            {columnToDelete && (
                <ConfirmDeleteModal
                    title="Confirmar Exclusão de Coluna"
                    message={`Tem certeza que deseja excluir la columna "<strong>${columnToDelete.title}</strong>"? As OSs nesta coluna precisarão ser movidas manualmente.`}
                    onConfirm={confirmDeleteColumn}
                    onCancel={() => setColumnToDelete(null)}
                />
            )}
        </div>
    );
};


export const SettingsPage: React.FC = () => {
    const { 
        users, addUser, updateUser, deleteUser, currentUser,
        catalogServices, addCatalogService, updateCatalogService, deleteCatalogService
    } = useAppContext();
    
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<CatalogServiceItem | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<CatalogServiceItem | null>(null);

    const handleOpenAddUserModal = () => {
        setUserToEdit(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditUserModal = (user: User) => {
        setUserToEdit(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (user: User) => {
        if (userToEdit) {
            await updateUser(user);
        } else {
            await addUser(user);
        }
        setIsUserModalOpen(false);
        setUserToEdit(null);
    };

    const handleDeleteUser = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };
    
    const handleOpenAddServiceModal = () => {
        setServiceToEdit(null);
        setIsServiceModalOpen(true);
    };

    const handleOpenEditServiceModal = (service: CatalogServiceItem) => {
        setServiceToEdit(service);
        setIsServiceModalOpen(true);
    };
    
    const handleSaveService = async (service: CatalogServiceItem) => {
        if (serviceToEdit) {
            await updateCatalogService(service);
        } else {
            await addCatalogService(service);
        }
        setIsServiceModalOpen(false);
        setServiceToEdit(null);
    };

    const handleDeleteService = async () => {
        if (serviceToDelete) {
            await deleteCatalogService(serviceToDelete.id);
            setServiceToDelete(null);
        }
    };

  return (
    <div className="max-w-7xl mx-auto text-white p-4 h-full flex flex-col">
      <div className="flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
            <Settings size={32} className="text-cadmium-yellow mr-4" />
            <h1 className="text-2xl md:text-3xl font-bold font-display">Configurações</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            {/* User Management */}
            <div className="bg-black/20 p-4 md:p-6 rounded-lg border border-granite-gray/20 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-200">Gerenciamento de Usuários</h2>
                  <button onClick={handleOpenAddUserModal} className="flex items-center px-3 py-1.5 bg-cadmium-yellow/80 rounded-lg text-xs font-bold text-coal-black hover:bg-cadmium-yellow"><PlusCircle size={16} className="mr-2" />Novo Usuário</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-granite-gray/20 hover:bg-granite-gray/10">
                                    <td className="p-3 flex items-center">
                                        <img src={user.picture} alt={user.name} className="h-10 w-10 rounded-full mr-4" />
                                        <div>
                                            <p className="font-semibold text-gray-100">{user.name}</p>
                                            <p className="text-sm text-granite-gray-light">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${roleColors[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleOpenEditUserModal(user)} className="p-2 text-granite-gray-light hover:text-cadmium-yellow transition-colors mr-1"><Edit size={18} /></button>
                                        <button onClick={() => setUserToDelete(user)} disabled={user.id === currentUser?.id} className="p-2 text-granite-gray-light hover:text-red-500 transition-colors disabled:opacity-30"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {/* Catalog Management */}
            <div className="bg-black/20 p-4 md:p-6 rounded-lg border border-granite-gray/20 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-200">Catálogo de Serviços</h2>
                  <button onClick={handleOpenAddServiceModal} className="flex items-center px-3 py-1.5 bg-cadmium-yellow/80 rounded-lg text-xs font-bold text-coal-black hover:bg-cadmium-yellow"><PlusCircle size={16} className="mr-2" />Novo Serviço</button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <tbody>
                            {catalogServices.map(service => (
                                <tr key={service.id} className="border-b border-granite-gray/20 hover:bg-granite-gray/10">
                                    <td className="p-3">
                                        <p className="font-semibold text-gray-100">{service.title}</p>
                                        <p className="text-sm text-granite-gray-light truncate max-w-xs">{service.description}</p>
                                    </td>
                                    <td className="p-3 font-semibold text-lg text-green-400 text-right">
                                        {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleOpenEditServiceModal(service)} className="p-2 text-granite-gray-light hover:text-cadmium-yellow transition-colors mr-1"><Edit size={18} /></button>
                                        <button onClick={() => setServiceToDelete(service)} className="p-2 text-granite-gray-light hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            {/* Kanban Settings */}
            <KanbanSettings />
            {/* Custom Fields Settings */}
            <CustomFieldsSettings />
        </div>

      </div>
      
      {isUserModalOpen && (
        <UserFormModal
            user={userToEdit}
            onClose={() => setIsUserModalOpen(false)}
            onSave={handleSaveUser}
        />
      )}

      {userToDelete && (
        <ConfirmDeleteModal
            title="Confirmar Exclusão de Usuário"
            message={`Tem certeza que deseja excluir o usuário ${userToDelete.name}? Esta ação não pode ser desfeita.`}
            onConfirm={handleDeleteUser}
            onCancel={() => setUserToDelete(null)}
        />
      )}
      
      {isServiceModalOpen && (
        <ServiceItemFormModal
            service={serviceToEdit}
            onClose={() => setIsServiceModalOpen(false)}
            onSave={handleSaveService}
        />
      )}

      {serviceToDelete && (
        <ConfirmDeleteModal
            title="Confirmar Exclusão de Serviço"
            message={`Tem certeza que deseja excluir o serviço "${serviceToDelete.title}" do catálogo?`}
            onConfirm={handleDeleteService}
            onCancel={() => setServiceToDelete(null)}
        />
      )}
    </div>
  );
};