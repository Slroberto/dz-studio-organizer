import React, { useMemo } from 'react';
import { useAppContext } from './AppContext';
import { ServiceOrder, Task, Comment, CustomFieldDefinition } from '../types';
import { Briefcase, ListTodo, MessageSquare, PlusCircle, LayoutGrid, GanttChartSquare, LayoutDashboard, ListChecks } from 'lucide-react';

interface SearchResults {
    orders: ServiceOrder[];
    tasks: { task: Task; order: ServiceOrder }[];
    comments: { comment: Comment; order: ServiceOrder }[];
    customFields: { field: CustomFieldDefinition; value: any; order: ServiceOrder }[];
}

interface GlobalSearchResultsProps {
    searchTerm: string;
    onClose: () => void;
    onSelectOrder: (order: ServiceOrder) => void;
    onAddOrderClick: () => void;
    onAddFromTemplateClick: () => void;
}

export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ 
    searchTerm, 
    onClose, 
    onSelectOrder,
    onAddOrderClick,
    onAddFromTemplateClick
}) => {
    const { orders, setCurrentPage, customFieldDefinitions } = useAppContext();

    const allCommands = useMemo(() => [
        { name: 'Nova Ordem de Serviço', action: onAddOrderClick, icon: <PlusCircle size={16} /> },
        { name: 'Nova OS a partir de Modelo', action: onAddFromTemplateClick, icon: <LayoutGrid size={16} /> },
        { name: 'Ir para Dashboard', action: () => setCurrentPage('Dashboard'), icon: <LayoutDashboard size={16} /> },
        { name: 'Ir para Produção', action: () => setCurrentPage('Produção'), icon: <GanttChartSquare size={16} /> },
    ], [onAddOrderClick, onAddFromTemplateClick, setCurrentPage]);

    const lowercasedTerm = searchTerm.toLowerCase();

    const filteredCommands = useMemo(() => {
        if (!lowercasedTerm) return [];
        return allCommands.filter(cmd => cmd.name.toLowerCase().includes(lowercasedTerm));
    }, [lowercasedTerm, allCommands]);

    const results = useMemo<SearchResults>(() => {
        if (!lowercasedTerm) {
            return { orders: [], tasks: [], comments: [], customFields: [] };
        }

        const foundOrders: ServiceOrder[] = [];
        const foundTasks: { task: Task; order: ServiceOrder }[] = [];
        const foundComments: { comment: Comment; order: ServiceOrder }[] = [];
        const foundCustomFields: { field: CustomFieldDefinition; value: any; order: ServiceOrder }[] = [];

        orders.forEach(order => {
            // Search in order fields
            if (
                order.orderNumber.toLowerCase().includes(lowercasedTerm) ||
                order.client.toLowerCase().includes(lowercasedTerm) ||
                order.description.toLowerCase().includes(lowercasedTerm)
            ) {
                foundOrders.push(order);
            }

            // Search in tasks
            order.tasks?.forEach(task => {
                if (task.text.toLowerCase().includes(lowercasedTerm)) {
                    foundTasks.push({ task, order });
                }
            });

            // Search in comments
            order.comments?.forEach(comment => {
                if (comment.text.toLowerCase().includes(lowercasedTerm)) {
                    foundComments.push({ comment, order });
                }
            });
            
            // Search in custom fields
            if (order.customFields && customFieldDefinitions) {
                for (const fieldId in order.customFields) {
                    const fieldDef = customFieldDefinitions.find(def => def.id === fieldId);
                    const value = order.customFields[fieldId];
                    
                    if (fieldDef && fieldDef.type === 'text' && typeof value === 'string') {
                        if (value.toLowerCase().includes(lowercasedTerm)) {
                            foundCustomFields.push({ field: fieldDef, value, order });
                        }
                    }
                }
            }
        });

        return { orders: foundOrders, tasks: foundTasks, comments: foundComments, customFields: foundCustomFields };
    }, [lowercasedTerm, orders, customFieldDefinitions]);

    const handleResultClick = (order: ServiceOrder) => {
        onSelectOrder(order);
        onClose();
    };
    
    const highlightMatch = (text: string) => {
        if (!lowercasedTerm) return text;
        const regex = new RegExp(`(${lowercasedTerm})`, 'gi');
        return text.split(regex).map((part, index) => 
            regex.test(part) ? <mark key={index} className="bg-cadmium-yellow/50 text-white rounded-sm px-0.5">{part}</mark> : part
        );
    };

    const totalResults = filteredCommands.length + results.orders.length + results.tasks.length + results.comments.length + results.customFields.length;

    return (
        <div className="absolute top-full mt-2 w-full md:w-[450px] bg-coal-black border border-granite-gray/20 rounded-lg shadow-2xl z-50 max-h-[60vh] flex flex-col" style={{ animation: 'fadeIn 0.2s ease-out forwards'}}>
            <div className="flex-1 overflow-y-auto p-2">
                {totalResults === 0 ? (
                    <div className="p-4 text-center text-granite-gray">Nenhum resultado encontrado.</div>
                ) : (
                    <>
                        {filteredCommands.length > 0 && (
                            <section>
                                <h3 className="px-2 py-1 text-xs font-semibold text-granite-gray-light uppercase tracking-wider">Ações</h3>
                                {filteredCommands.map(cmd => (
                                    <div key={cmd.name} onClick={() => { cmd.action(); onClose(); }} className="p-2 rounded-md hover:bg-granite-gray/10 cursor-pointer">
                                        <div className="flex items-center">
                                            <div className="mr-3 text-cadmium-yellow">{cmd.icon}</div>
                                            <p className="font-semibold text-sm text-white">{highlightMatch(cmd.name)}</p>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                        {results.orders.length > 0 && (
                            <section className="mt-2">
                                <h3 className="px-2 py-1 text-xs font-semibold text-granite-gray-light uppercase tracking-wider">Ordens de Serviço</h3>
                                {results.orders.map(order => (
                                    <div key={`order-${order.id}`} onClick={() => handleResultClick(order)} className="p-2 rounded-md hover:bg-granite-gray/10 cursor-pointer">
                                        <div className="flex items-center">
                                            <Briefcase size={16} className="mr-3 text-cadmium-yellow flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-white">{highlightMatch(order.orderNumber)} - {highlightMatch(order.client)}</p>
                                                <p className="text-xs text-gray-400 truncate">{highlightMatch(order.description)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                        {results.tasks.length > 0 && (
                           <section className="mt-2">
                                <h3 className="px-2 py-1 text-xs font-semibold text-granite-gray-light uppercase tracking-wider">Tarefas</h3>
                                {results.tasks.map(({ task, order }) => (
                                    <div key={`task-${task.id}`} onClick={() => handleResultClick(order)} className="p-2 rounded-md hover:bg-granite-gray/10 cursor-pointer">
                                        <div className="flex items-center">
                                            <ListTodo size={16} className="mr-3 text-blue-400 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-white">{highlightMatch(task.text)}</p>
                                                <p className="text-xs text-gray-400">em {order.orderNumber} - {order.client}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                        {results.comments.length > 0 && (
                            <section className="mt-2">
                                <h3 className="px-2 py-1 text-xs font-semibold text-granite-gray-light uppercase tracking-wider">Comentários</h3>
                                {results.comments.map(({ comment, order }) => (
                                    <div key={`comment-${comment.id}`} onClick={() => handleResultClick(order)} className="p-2 rounded-md hover:bg-granite-gray/10 cursor-pointer">
                                        <div className="flex items-center">
                                            <MessageSquare size={16} className="mr-3 text-green-400 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-white truncate">{highlightMatch(comment.text)}</p>
                                                <p className="text-xs text-gray-400">por {comment.userName} em {order.orderNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                         {results.customFields.length > 0 && (
                            <section className="mt-2">
                                <h3 className="px-2 py-1 text-xs font-semibold text-granite-gray-light uppercase tracking-wider">Campos Personalizados</h3>
                                {results.customFields.map(({ field, value, order }) => (
                                    <div key={`cf-${order.id}-${field.id}`} onClick={() => handleResultClick(order)} className="p-2 rounded-md hover:bg-granite-gray/10 cursor-pointer">
                                        <div className="flex items-center">
                                            <ListChecks size={16} className="mr-3 text-purple-400 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-white">{highlightMatch(String(value))}</p>
                                                <p className="text-xs text-gray-400">em {field.name} ({order.orderNumber} - {order.client})</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                    </>
                )}
            </div>
            <div className="p-2 border-t border-granite-gray/20 text-right text-xs text-granite-gray">
                {totalResults} resultado(s)
            </div>
        </div>
    );
};