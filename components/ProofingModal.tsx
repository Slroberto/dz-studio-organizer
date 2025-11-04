import React, { useState, useRef, MouseEvent } from 'react';
import { ProofImage, ProofComment } from '../types';
import { X, MessageSquare, Send } from 'lucide-react';

interface ProofingModalProps {
  image: ProofImage;
  orderId: string;
  onClose: () => void;
  onAddComment: (orderId: string, imageId: string, commentData: Omit<ProofComment, 'id'|'timestamp'|'resolved'>) => Promise<void>;
}

interface NewCommentInfo {
  x: number;
  y: number;
  text: string;
}

export const ProofingModal: React.FC<ProofingModalProps> = ({ image, orderId, onClose, onAddComment }) => {
  const [comments, setComments] = useState<ProofComment[]>(image.comments);
  const [newComment, setNewComment] = useState<NewCommentInfo | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (newComment) return; // Only one new comment at a time

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setNewComment({ x, y, text: '' });
  };

  const handleSaveComment = async () => {
    if (newComment && newComment.text.trim()) {
      const commentData = {
        x: newComment.x,
        y: newComment.y,
        text: newComment.text,
        author: 'Cliente',
      };
      await onAddComment(orderId, image.id, commentData);
      
      // Optimistically update UI
      const optimisticComment: ProofComment = {
        id: `temp-${Date.now()}`,
        ...commentData,
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      setComments(prev => [...prev, optimisticComment]);
      setNewComment(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 modal-backdrop-animation"
      onClick={onClose}
    >
      <div
        className="bg-coal-black rounded-xl w-full max-w-6xl h-[90vh] flex border border-granite-gray/20 shadow-2xl modal-content-animation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Area */}
        <div className="flex-1 bg-black/50 flex items-center justify-center p-4">
          <div ref={imageWrapperRef} className="relative w-full h-full" onClick={handleImageClick}>
            <img src={image.url} alt="Proof" className="w-full h-full object-contain" />
            
            {/* Existing Comments */}
            {comments.map((comment, index) => (
              <div
                key={comment.id}
                className="absolute w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm cursor-pointer border-2 border-white shadow-lg"
                style={{ left: `${comment.x}%`, top: `${comment.y}%`, transform: 'translate(-50%, -50%)' }}
                title={comment.text}
              >
                {index + 1}
              </div>
            ))}

            {/* New Comment Marker */}
            {newComment && (
              <div
                className="absolute"
                style={{ left: `${newComment.x}%`, top: `${newComment.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                 <div className="relative w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg border-2 border-white shadow-lg animate-pulse">
                    +
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments Sidebar */}
        <div className="w-80 flex-shrink-0 bg-coal-black/80 border-l border-granite-gray/20 flex flex-col">
          <div className="p-4 border-b border-granite-gray/20 flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Comentários</h3>
            <button onClick={onClose} className="text-granite-gray-light hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.map((comment, index) => (
              <div key={comment.id} className="p-3 bg-granite-gray/10 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex-shrink-0 flex items-center justify-center font-bold text-xs">{index + 1}</div>
                    <div>
                        <p className="font-semibold text-gray-200">{comment.author}</p>
                        <p className="text-sm text-gray-400">{comment.text}</p>
                    </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && !newComment && (
                <div className="text-center text-granite-gray pt-10">
                    <MessageSquare size={32} className="mx-auto mb-2"/>
                    <p>Nenhum comentário nesta imagem.</p>
                    <p className="text-sm">Clique na imagem para adicionar uma anotação.</p>
                </div>
            )}
          </div>

          {/* New Comment Input */}
          {newComment && (
            <div className="p-4 border-t border-granite-gray/20 bg-black/30">
                <p className="text-sm font-semibold mb-2 text-gray-200">Adicionar Comentário</p>
                <textarea
                    value={newComment.text}
                    onChange={(e) => setNewComment(prev => prev ? { ...prev, text: e.target.value } : null)}
                    rows={3}
                    placeholder="Escreva seu feedback aqui..."
                    className="w-full bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow"
                    autoFocus
                />
                <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setNewComment(null)} className="px-3 py-1 text-sm rounded-lg text-gray-300 bg-granite-gray/20 hover:bg-granite-gray/40">Cancelar</button>
                    <button onClick={handleSaveComment} className="px-3 py-1 text-sm font-bold rounded-lg text-coal-black bg-cadmium-yellow hover:brightness-110 flex items-center gap-1.5"><Send size={14}/> Enviar</button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};