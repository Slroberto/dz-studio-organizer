import React from 'react';
import { KanbanColumn } from '../types';
import { Check, Loader } from 'lucide-react';

interface PortalProgressStepperProps {
  orderStatus: string;
  columns: KanbanColumn[];
}

export const PortalProgressStepper: React.FC<PortalProgressStepperProps> = ({ orderStatus, columns }) => {
    const activeColumns = columns.filter(c => c.status !== 'Entregue');
    const currentIndex = activeColumns.findIndex(c => c.status === orderStatus);
    const isCompleted = orderStatus === 'Entregue';

    return (
        <div className="w-full">
            <div className="flex items-center">
                {activeColumns.map((column, index) => {
                    const isActive = index === currentIndex;
                    const isDone = isCompleted || (currentIndex !== -1 && index < currentIndex);
                    
                    return (
                        <React.Fragment key={column.status}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                        isDone ? 'bg-yellow-500 border-yellow-500 text-white' : 
                                        isActive ? 'bg-yellow-500 border-yellow-500 text-white' : 
                                        'bg-white border-gray-300'
                                    }`}
                                >
                                    {isDone ? <Check size={18} /> : isActive ? <Loader size={18} className="animate-spin" /> : <div className="w-2 h-2 bg-gray-300 rounded-full"></div>}
                                </div>
                                <p className={`mt-2 text-xs text-center font-semibold transition-colors ${isActive || isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {column.title}
                                </p>
                            </div>
                            {index < activeColumns.length - 1 && (
                                <div className={`flex-1 h-1 transition-colors duration-500 mx-2 ${isDone || isActive ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            {isCompleted && (
                 <div className="mt-6 text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <Check size={24} className="mx-auto text-green-600 mb-2"/>
                    <h4 className="font-bold text-green-800">Projeto Concluído!</h4>
                    <p className="text-sm text-green-700">Todos os seus arquivos foram entregues. Utilize o botão de download acima.</p>
                </div>
            )}
        </div>
    );
};