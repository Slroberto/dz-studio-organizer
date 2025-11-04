import React, { useEffect, useState } from 'react';
import { useAppContext } from './AppContext';
import { Camera, Hash, FileText, Calendar, User, Download, AlertTriangle, Loader, ImageIcon } from 'lucide-react';
import { ServiceOrder, ProofImage } from '../types';
import { PortalProgressStepper } from './PortalProgressStepper';
import { ProofingModal } from './ProofingModal';

interface ClientPortalPageProps {
    token: string;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ token }) => {
    const { orders, kanbanColumns, isDataLoading, currentUser, login, addProofComment } = useAppContext();
    const [order, setOrder] = useState<ServiceOrder | null | undefined>(undefined);
    const [selectedImage, setSelectedImage] = useState<ProofImage | null>(null);

    useEffect(() => {
        // In mock mode, we need to "log in" to get the orders data.
        // This is a workaround for the mock environment. In a real app,
        // this page would likely have its own unauthenticated API endpoint.
        if (!currentUser) {
            login('sandro@dz.studio', '123'); // Auto-login to load data
        }
    }, [currentUser, login]);

    useEffect(() => {
        if (orders.length > 0) {
            const foundOrder = orders.find(o => o.shareableToken === token);
            setOrder(foundOrder || null);
        }
    }, [orders, token]);

    if (order === undefined || isDataLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100 text-gray-800">
                <Loader className="animate-spin text-gray-500" size={48} />
                <p className="ml-4 text-lg">Carregando informações do projeto...</p>
            </div>
        );
    }

    if (order === null) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-gray-100 text-gray-800 p-4">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Projeto não encontrado</h1>
                    <p className="mt-6 text-base leading-7 text-gray-600">O link que você acessou é inválido ou o projeto foi removido. Por favor, contate o estúdio para um novo link.</p>
                </div>
            </div>
        );
    }
    
    const isDelivered = order.status === 'Entregue';

    return (
        <>
            <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
                <header className="bg-white shadow-sm">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center">
                            <Camera className="text-yellow-500 h-8 w-8" />
                            <h1 className="text-2xl font-display font-bold ml-3 text-gray-900">DZ Studio</h1>
                        </div>
                        <p className="text-sm font-medium text-gray-500">Portal do Cliente</p>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">{order.client}</h2>
                                    <p className="text-gray-500 font-medium">{order.orderNumber}</p>
                                </div>
                                {isDelivered && (
                                    <a
                                        href={order.link || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center justify-center px-6 py-3 bg-yellow-500 rounded-lg text-lg font-bold text-white hover:bg-yellow-600 transition-transform transform active:scale-95 ${!order.link || order.link === '#' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Download size={20} className="mr-2" />
                                        Baixar Arquivos
                                    </a>
                                )}
                            </div>
                            <p className="mt-4 text-gray-700">{order.description}</p>
                        </div>

                        <div className="p-6 md:p-8 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">Progresso do Projeto</h3>
                            <PortalProgressStepper orderStatus={order.status} columns={kanbanColumns} />
                        </div>

                        {order.proofingGallery && order.proofingGallery.length > 0 && (
                             <div className="p-6 md:p-8 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Galeria para Aprovação</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {order.proofingGallery.map(image => (
                                        <div key={image.id} onClick={() => setSelectedImage(image)} className="group cursor-pointer aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden relative">
                                            <img src={image.url} alt={`Prova ${image.id}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ImageIcon className="text-white" size={32} />
                                            </div>
                                            {image.comments.length > 0 && (
                                                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                    {image.comments.length}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border-t border-gray-200">
                            <div className="bg-white p-4 flex items-center">
                                <Calendar size={20} className="text-gray-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Previsão de Entrega</p>
                                    <p className="font-semibold text-gray-800">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 flex items-center">
                                <User size={20} className="text-gray-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Responsável no Estúdio</p>
                                    <p className="font-semibold text-gray-800">{order.responsible || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 flex items-center">
                                <FileText size={20} className="text-gray-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Quantidade de Imagens</p>
                                    <p className="font-semibold text-gray-800">{order.imageCount || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <footer className="text-center py-6 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} DZ Studio. Todos os direitos reservados.</p>
                </footer>
            </div>
            {selectedImage && (
                <ProofingModal 
                    image={selectedImage}
                    orderId={order.id}
                    onClose={() => setSelectedImage(null)}
                    onAddComment={addProofComment}
                />
            )}
        </>
    );
};