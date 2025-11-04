import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useAppContext } from './AppContext';
import { ChannelType, ChatChannel, ChatMessage, User, ChatAttachment } from '../types';
import { PlusCircle, Send, Users, User as UserIcon, X, Paperclip, File as FileIcon, Download, Smile, CornerDownRight, Search, Edit, Trash2, Loader, Info } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ChannelInfoPanel } from './ChannelInfoPanel';

const NewChatModal: React.FC<{
    onClose: () => void;
    onCreate: (name: string, members: string[], type: ChannelType) => Promise<string | null>;
    onChannelSelect: (channelId: string) => void;
}> = ({ onClose, onCreate, onChannelSelect }) => {
    const { users, currentUser } = useAppContext();
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [groupName, setGroupName] = useState('');
    const [isGroupChat, setIsGroupChat] = useState(false);

    if (!currentUser) return null;

    const otherUsers = users.filter(u => u.id !== currentUser.id && u.id !== 'user-bot');

    const handleUserToggle = (userId: string) => {
        setSelectedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                if (!isGroupChat && newSet.size > 0) { 
                    newSet.clear(); 
                }
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSubmit = async () => {
        if (selectedUsers.size === 0 || !currentUser) return;
        const members = [currentUser.id, ...Array.from(selectedUsers)];
        const type = isGroupChat ? ChannelType.Group : ChannelType.Private;

        // For groups, the name is the group name.
        // For private chats, the name is an empty string, as the display name is derived from members.
        const name = isGroupChat ? groupName : '';

        const newChannelId = await onCreate(name, members, type);
        if(newChannelId) {
            onChannelSelect(newChannelId);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 modal-backdrop-animation p-4" onClick={onClose}>
            <div className="bg-coal-black rounded-xl p-6 w-full max-w-md border border-granite-gray/20 shadow-2xl modal-content-animation" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Nova Conversa</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="chatType" checked={!isGroupChat} onChange={() => {setSelectedUsers(new Set()); setIsGroupChat(false);}} className="form-radio bg-black/30 text-cadmium-yellow focus:ring-cadmium-yellow" />
                        Privada
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="chatType" checked={isGroupChat} onChange={() => {setSelectedUsers(new Set()); setIsGroupChat(true);}} className="form-radio bg-black/30 text-cadmium-yellow focus:ring-cadmium-yellow" />
                        Grupo
                    </label>
                </div>

                {isGroupChat && (
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Nome do Grupo"
                        className="w-full bg-black/30 p-2 rounded border border-granite-gray/50 mb-4"
                    />
                )}

                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {otherUsers.map(user => (
                        <div key={user.id} onClick={() => handleUserToggle(user.id)} className={`flex items-center p-2 rounded-lg cursor-pointer ${selectedUsers.has(user.id) ? 'bg-cadmium-yellow/20' : 'hover:bg-granite-gray/10'}`}>
                            <input type={isGroupChat ? "checkbox" : "radio"} readOnly checked={selectedUsers.has(user.id)} className="mr-3 form-checkbox bg-black/30 text-cadmium-yellow focus:ring-cadmium-yellow" />
                            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full mr-3" />
                            <span>{user.name}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSubmit} disabled={selectedUsers.size === 0 || (isGroupChat && !groupName.trim())} className="px-6 py-2 bg-cadmium-yellow text-coal-black font-bold rounded-lg hover:brightness-110 disabled:opacity-50">
                        Iniciar Conversa
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ChannelListItemProps {
    channel: ChatChannel;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const ChannelListItem: React.FC<ChannelListItemProps> = ({ channel, isSelected, onSelect }) => {
    const { currentUser, users } = useAppContext();
    if (!currentUser) return null;

    const getChannelDisplayInfo = () => {
        if (channel.type === ChannelType.Private) {
            const otherMemberId = channel.members.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherMemberId);
            return {
                name: otherUser?.name || 'Usuário Desconhecido',
                avatar: otherUser?.picture,
            };
        }
        return { name: channel.name, avatar: null };
    };

    const { name, avatar } = getChannelDisplayInfo();

    const lastMessageText = () => {
        if (!channel.lastMessage) return 'Nenhuma mensagem';
        if (channel.lastMessage.attachment && !channel.lastMessage.text) return `📎 ${channel.lastMessage.attachment.name}`;
        return channel.lastMessage.text;
    }

    return (
        <div
            onClick={() => onSelect(channel.id)}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-cadmium-yellow/10' : 'hover:bg-granite-gray/10'}`}
        >
            <div className="relative mr-3">
                {avatar ? (
                    <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-granite-gray/20 flex items-center justify-center"><Users size={20} className="text-gray-400"/></div>
                )}
                {channel.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-coal-black">
                        {channel.unreadCount}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>{name}</p>
                <p className="text-sm text-granite-gray-light truncate">{lastMessageText()}</p>
            </div>
        </div>
    );
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AttachmentDisplay = ({ attachment, isCurrentUser }: { attachment: ChatAttachment, isCurrentUser: boolean }) => {
    if (attachment.type.startsWith('image/')) {
        return (
            <img 
                src={attachment.url} 
                alt={attachment.name} 
                className="mt-2 rounded-lg max-w-full h-auto max-h-64 cursor-pointer"
                onClick={() => window.open(attachment.url, '_blank')}
            />
        );
    }

    return (
        <a 
            href={attachment.url} 
            download={attachment.name}
            className={`mt-2 flex items-center p-2 rounded-lg ${isCurrentUser ? 'bg-black/10' : 'bg-black/20'} hover:bg-black/30`}
        >
            <FileIcon size={32} className="mr-3 flex-shrink-0 text-gray-400" />
            <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{attachment.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
            </div>
             <Download size={20} className="ml-auto flex-shrink-0 text-gray-400" />
        </a>
    );
};

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const renderWithMentionsAndLinks = (text: string, users: User[]): (string | React.ReactElement)[] => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /@([\w\s()]+)/g;
    const combinedRegex = new RegExp(`(${urlRegex.source})|(${mentionRegex.source})`, 'g');

    const parts = text.split(combinedRegex);

    return parts.filter(Boolean).map((part, index) => {
        if (part.match(urlRegex)) {
            return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">{part}</a>;
        }
        if (part.startsWith('@')) {
            const mentionName = part.substring(1);
             const userExists = users.some(u => u.name === mentionName.trim());
             return <strong key={index} className={userExists ? 'bg-cadmium-yellow/20 text-cadmium-yellow rounded px-1' : ''}>@{mentionName}</strong>;
        }
        return part;
    });
};

const renderBotMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean); // Split by **bolded** parts
    return (
        <div className="text-sm whitespace-pre-wrap break-words">
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="text-white">{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </div>
    );
};

const formatDateSeparator = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const PAGE_SIZE = 30; // Number of messages to load at a time

export const ChatPage = () => {
    const { channels, messages, currentUser, sendMessage, users, createChannel, toggleReaction, editMessage, deleteMessage, setUserTyping, typingStatus } = useAppContext();
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
    const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
    
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    // State for @mentions
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [activeMentionIndex, setActiveMentionIndex] = useState(0);

    // State for in-chat search
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    // State for message pagination
    const [displayedMessagesCount, setDisplayedMessagesCount] = useState<Record<string, number>>({});
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);

    // Reset message count and scroll to bottom when channel changes
    useEffect(() => {
        if (selectedChannelId) {
            setDisplayedMessagesCount(prev => ({...prev, [selectedChannelId]: PAGE_SIZE}));
            // We need a slight delay for the new messages to render before scrolling
            setTimeout(() => scrollToBottom(true), 100);
        }
    }, [selectedChannelId]);

    useEffect(() => {
        if (!selectedChannelId && channels.length > 0) {
            setSelectedChannelId(channels[0].id);
        }
    }, [channels, selectedChannelId]);

    useEffect(() => {
      if (editingMessage && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, [editingMessage]);

    const scrollToBottom = (force = false) => {
        if (force) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleChannelSelect = (id: string) => {
        setSelectedChannelId(id);
        setSearchTerm('');
        setIsSearchVisible(false);
    };

    const selectedChannel = useMemo(() => channels.find(c => c.id === selectedChannelId), [channels, selectedChannelId]);
    
    const allChannelMessages = useMemo(() => {
        return messages
            .filter(m => m.channelId === selectedChannelId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, selectedChannelId]);

    const currentMessages = useMemo(() => {
        const count = displayedMessagesCount[selectedChannelId!] || PAGE_SIZE;
        const slicedMessages = allChannelMessages.slice(-count);

        if (!searchTerm.trim()) {
            return slicedMessages;
        }

        const lowercasedTerm = searchTerm.toLowerCase();
        return slicedMessages.filter(m => m.text && m.text.toLowerCase().includes(lowercasedTerm));
    }, [allChannelMessages, displayedMessagesCount, selectedChannelId, searchTerm]);

    const hasMoreMessages = (allChannelMessages.length > (displayedMessagesCount[selectedChannelId!] || PAGE_SIZE));

    const scrollState = useRef({
        shouldPreserve: false,
        oldScrollHeight: 0,
    }).current;

    const loadMoreMessages = () => {
        if (!messagesContainerRef.current) return;
        
        setIsLoadingMore(true);
        scrollState.shouldPreserve = true;
        scrollState.oldScrollHeight = messagesContainerRef.current.scrollHeight;
        
        setTimeout(() => { // Simulate delay for better UX
            setDisplayedMessagesCount(prev => ({
                ...prev,
                [selectedChannelId!]: (prev[selectedChannelId!] || PAGE_SIZE) + PAGE_SIZE
            }));
            setIsLoadingMore(false);
        }, 500);
    };
    
    useLayoutEffect(() => {
        if (scrollState.shouldPreserve && messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - scrollState.oldScrollHeight;
            scrollState.shouldPreserve = false;
        }
    }, [currentMessages, scrollState]);

    useEffect(() => {
        // Scroll to bottom only when not preserving scroll or when a new message from the user is sent
        if (!scrollState.shouldPreserve) {
            scrollToBottom();
        }
    }, [currentMessages, typingStatus]);

    const highlightMatch = (text: string, term: string) => {
        const renderedMentions = renderWithMentionsAndLinks(text, users);
        if (!term) return renderedMentions;
        
        const regex = new RegExp(`(${term})`, 'gi');
        
        return renderedMentions.map((part, index) => {
            if (typeof part === 'string') {
                return part.split(regex).map((subPart, subIndex) => 
                    regex.test(subPart) ? <mark key={`${index}-${subIndex}`} className="bg-cadmium-yellow/50 text-white rounded-sm px-0.5">{subPart}</mark> : subPart
                );
            }
            return part;
        });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if ((newMessage.trim() || attachment) && selectedChannelId) {
            sendMessage(selectedChannelId, newMessage.trim(), attachment || undefined, replyingTo?.id);
            setNewMessage('');
            setAttachment(null);
            setReplyingTo(null);
        }
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('O arquivo é muito grande. O limite é 10MB.');
                return;
            }
            setAttachment(file);
        }
    };
    
    const handleSaveEdit = () => {
      if (editingMessage && editingMessage.text.trim()) {
          editMessage(editingMessage.id, editingMessage.text.trim());
      }
      setEditingMessage(null);
    };

    const handleConfirmDelete = async () => {
        if (messageToDelete) {
            await deleteMessage(messageToDelete.id);
        }
        setMessageToDelete(null);
    };

    const mentionSuggestions = useMemo(() => {
        if (!mentionQuery) return [];
        return users.filter(u =>
            u.id !== currentUser?.id &&
            u.id !== 'user-bot' &&
            u.name.toLowerCase().includes(mentionQuery.toLowerCase())
        );
    }, [mentionQuery, users, currentUser]);

    const handleNewMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setNewMessage(text);
        
        if (selectedChannelId) {
            setUserTyping(selectedChannelId);
        }

        const cursorPosition = e.target.selectionStart;
        const textUpToCursor = text.substring(0, cursorPosition);
        const lastAt = textUpToCursor.lastIndexOf('@');
        const lastSpace = textUpToCursor.lastIndexOf(' ');

        if (lastAt > lastSpace) {
            const query = textUpToCursor.substring(lastAt + 1);
            setMentionQuery(query);
            setShowMentionPopup(true);
            setActiveMentionIndex(0);
        } else {
            setShowMentionPopup(false);
        }
    };
    
    const handleSelectMention = (user: User) => {
        const cursorPosition = textareaRef.current?.selectionStart || 0;
        const textUpToCursor = newMessage.substring(0, cursorPosition);
        const lastAt = textUpToCursor.lastIndexOf('@');
        
        const textBefore = newMessage.substring(0, lastAt);
        const textAfter = newMessage.substring(cursorPosition);
        
        const newText = `${textBefore}@${user.name} ${textAfter}`;
        setNewMessage(newText);
        setShowMentionPopup(false);

        setTimeout(() => {
            textareaRef.current?.focus();
            const newCursorPosition = (textBefore + `@${user.name} `).length;
            textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
    };

    const handleMentionKeyDown = (e: React.KeyboardEvent) => {
        if (showMentionPopup && mentionSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveMentionIndex(prev => (prev + 1) % mentionSuggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveMentionIndex(prev => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleSelectMention(mentionSuggestions[activeMentionIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentionPopup(false);
            }
        }
    };
    
    if (!currentUser) return null;
    
    const typingIndicator = useMemo(() => {
      if (!selectedChannelId || !typingStatus[selectedChannelId]) return null;

      const typers = typingStatus[selectedChannelId]
          .filter(t => t.userName !== currentUser.name)
          .map(t => t.userName.split(' ')[0]);

      if (typers.length === 0) return null;

      let text = '';
      if (typers.length === 1) {
          text = `${typers[0]} está digitando`;
      } else if (typers.length === 2) {
          text = `${typers[0]} e ${typers[1]} estão digitando`;
      } else {
          text = `${typers[0]}, ${typers[1]} e mais ${typers.length - 2} estão digitando`;
      }
      
      return (
          <div className="text-sm text-granite-gray-light italic flex items-center h-5 transition-opacity duration-300">
              {text}
              <span className="typing-dots ml-1">
                  <span>.</span><span>.</span><span>.</span>
              </span>
          </div>
      );
    }, [typingStatus, selectedChannelId, currentUser.name]);


    const getChannelDisplayName = (channel: ChatChannel) => {
        if (channel.type === ChannelType.Private) {
            const otherMemberId = channel.members.find(id => id !== currentUser.id);
            return users.find(u => u.id === otherMemberId)?.name || 'Conversa';
        }
        return channel.name;
    };

    const messageListWithSeparators = useMemo(() => {
        const components: React.ReactElement[] = [];
        let lastMessageDateString: string | null = null;
        let lastSenderId: string | null = null;
        let lastMessageTimestamp: number | null = null;

        currentMessages.forEach((msg) => {
            const messageDate = new Date(msg.timestamp);
            const messageDateString = messageDate.toDateString();

            if (messageDateString !== lastMessageDateString) {
                components.push(
                    <div key={`date-${msg.id}`} className="relative my-4 h-px bg-granite-gray/20">
                        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-black/50 px-2 text-xs font-semibold text-granite-gray-light rounded-full">
                            {formatDateSeparator(msg.timestamp)}
                        </span>
                    </div>
                );
            }
            lastMessageDateString = messageDateString;

            const timeSinceLastMessage = lastMessageTimestamp ? (messageDate.getTime() - lastMessageTimestamp) / (1000 * 60) : Infinity;
            const isGrouped = msg.senderId === lastSenderId && timeSinceLastMessage < 5;
            
            lastSenderId = msg.senderId;
            lastMessageTimestamp = messageDate.getTime();
            
            const isCurrentUser = msg.senderId === currentUser.id;
            const isBotMessage = msg.senderId === 'user-bot';
            const originalMessage = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
            const isMentioned = msg.mentions?.includes(currentUser.id);
            const isEditing = editingMessage?.id === msg.id;
            
            components.push(
                 <div key={msg.id} className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${!isGrouped ? 'mt-4' : 'mt-1'}`}>
                    {!isCurrentUser && (
                        <div className="w-8 flex-shrink-0">
                            {!isGrouped && <img src={msg.senderPicture} alt={msg.senderName} className="w-8 h-8 rounded-full" />}
                        </div>
                    )}
                    <div className={`group relative ${isMentioned ? 'bg-yellow-900/30 rounded-lg' : ''}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isCurrentUser ? 'bg-cadmium-yellow text-coal-black' : isBotMessage ? 'bg-black/30 border border-blue-500/30' : 'bg-granite-gray/20'}`}>
                            {!isCurrentUser && !isGrouped && (
                                <p className={`text-xs font-bold mb-1 flex items-center ${isBotMessage ? 'text-blue-300' : 'text-cadmium-yellow'}`}>
                                    {msg.senderName}
                                    {isBotMessage && <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-500/20">BOT</span>}
                                </p>
                            )}
                            
                            {originalMessage && (
                                <div className={`text-xs p-2 border-l-2 mb-2 rounded-l ${isCurrentUser ? 'border-coal-black/30 bg-black/10' : 'border-granite-gray/50 bg-black/20'}`}>
                                    <p className="font-semibold">{originalMessage.senderName}</p>
                                    <p className={`truncate ${isCurrentUser ? 'text-coal-black/70' : 'text-granite-gray-light'}`}>{originalMessage.text || 'Anexo'}</p>
                                </div>
                            )}
                            
                            {isEditing ? (
                                <textarea
                                ref={editInputRef}
                                value={editingMessage.text}
                                onChange={(e) => setEditingMessage({ ...editingMessage, text: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                                    if (e.key === 'Escape') { e.preventDefault(); setEditingMessage(null); }
                                }}
                                className="w-full bg-black/30 text-white p-2 rounded border border-granite-gray/50 text-sm"
                                />
                            ) : msg.text && (isBotMessage ? renderBotMessage(msg.text) : <p className="text-sm whitespace-pre-wrap break-words">{highlightMatch(msg.text, searchTerm)}</p>)}
                            
                            {msg.attachment && <AttachmentDisplay attachment={msg.attachment} isCurrentUser={isCurrentUser} />}
                            
                            <p className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-800/70' : 'text-gray-400'} text-right`}>
                                {msg.editedAt && <span className='italic mr-1'>(editado)</span>}
                                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        
                        {!isBotMessage && !isEditing && isCurrentUser && (
                            <div className={`absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'} -mt-1 flex items-center gap-1 bg-coal-black p-1 rounded-full border border-granite-gray/20 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                                <button onClick={() => setEditingMessage({ id: msg.id, text: msg.text })} className="p-1 hover:bg-granite-gray/20 rounded-full"><Edit size={16} /></button>
                                <button onClick={() => setMessageToDelete(msg)} className="p-1 hover:bg-granite-gray/20 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        )}
                        {!isBotMessage && !isEditing && !isCurrentUser && (
                            <div className={`absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'} -mt-1 flex items-center gap-1 bg-coal-black p-1 rounded-full border border-granite-gray/20 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                                <button onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)} className="p-1 hover:bg-granite-gray/20 rounded-full"><Smile size={16} /></button>
                                <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-granite-gray/20 rounded-full"><CornerDownRight size={16} /></button>
                            </div>
                        )}

                        {showEmojiPickerFor === msg.id && (
                            <div className={`absolute top-0 ${isCurrentUser ? 'left-auto right-full mr-2' : 'left-full ml-2'} mt-8 flex items-center gap-1 bg-coal-black p-1 rounded-full border border-granite-gray/20 shadow-lg z-10`}>
                                {EMOJI_OPTIONS.map(emoji => (
                                    <button key={emoji} onClick={() => { toggleReaction(msg.channelId, msg.id, emoji); setShowEmojiPickerFor(null); }} className="p-1.5 text-lg rounded-full hover:bg-granite-gray/20 transition-transform transform active:scale-90">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={`mt-1.5 flex items-center gap-1 flex-wrap ${isCurrentUser ? 'justify-end' : ''}`}>
                                {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                                    const reactionUserIds = userIds as string[];
                                    if (reactionUserIds.length === 0) return null;
                                    const isReactedByCurrentUser = reactionUserIds.includes(currentUser.id);
                                    return (
                                        <button key={emoji} onClick={() => toggleReaction(msg.channelId, msg.id, emoji)} className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors ${isReactedByCurrentUser ? 'bg-cadmium-yellow/30 border border-cadmium-yellow' : 'bg-granite-gray/20 border border-transparent hover:border-granite-gray'}`}>
                                            <span>{emoji}</span>
                                            <span className="font-semibold">{reactionUserIds.length}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        });

        return components;
    }, [currentMessages, currentUser, messages, editingMessage, showEmojiPickerFor, searchTerm]);

    return (
        <>
            <div className="flex h-full bg-black/20 rounded-lg border border-granite-gray/20 text-white overflow-hidden">
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 border-r border-granite-gray/20 flex flex-col">
                    <div className="p-4 border-b border-granite-gray/20 flex-shrink-0 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Conversas</h2>
                        <button onClick={() => setIsNewChatModalOpen(true)} title="Nova conversa" className="p-2 text-cadmium-yellow hover:bg-cadmium-yellow/10 rounded-full">
                            <PlusCircle size={20} />
                        </button>
                    </div>
                    <div className="flex-1 p-2 overflow-y-auto">
                        {channels.map(channel => (
                            <ChannelListItem
                                key={channel.id}
                                channel={channel}
                                isSelected={channel.id === selectedChannelId}
                                onSelect={handleChannelSelect}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    {selectedChannel ? (
                        <>
                            <div className="p-4 border-b border-granite-gray/20 flex-shrink-0 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">{getChannelDisplayName(selectedChannel)}</h3>
                                    {searchTerm && <p className="text-xs text-granite-gray-light">{currentMessages.length} resultado(s) encontrado(s)</p>}
                                </div>
                                <div className="relative flex items-center gap-2">
                                    {isSearchVisible && (
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar na conversa..."
                                            className="w-48 bg-black/30 border border-granite-gray/50 rounded-lg px-3 py-1 text-sm transition-all card-enter-animation"
                                            autoFocus
                                        />
                                    )}
                                    <button onClick={() => { setIsSearchVisible(!isSearchVisible); if (isSearchVisible) setSearchTerm(''); }} className="p-2 text-granite-gray-light hover:text-white rounded-full hover:bg-granite-gray/20">
                                        {isSearchVisible ? <X size={18} /> : <Search size={18} />}
                                    </button>
                                    <button onClick={() => setIsInfoPanelOpen(true)} className="p-2 text-granite-gray-light hover:text-white rounded-full hover:bg-granite-gray/20" title="Informações do canal">
                                        <Info size={18} />
                                    </button>
                                </div>
                            </div>
                            <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto">
                                {hasMoreMessages && !searchTerm && (
                                    <div className="text-center my-4">
                                        <button
                                            onClick={loadMoreMessages}
                                            disabled={isLoadingMore}
                                            className="px-4 py-2 text-sm font-semibold text-cadmium-yellow bg-granite-gray/20 rounded-full hover:bg-granite-gray/40 disabled:opacity-50 flex items-center justify-center mx-auto"
                                        >
                                            {isLoadingMore ? <Loader size={16} className="animate-spin mr-2" /> : null}
                                            Carregar mensagens antigas
                                        </button>
                                    </div>
                                )}
                                <div className="space-y-0">
                                    {messageListWithSeparators}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                            <div className="p-4 border-t border-granite-gray/20 flex-shrink-0 relative">
                                {showMentionPopup && mentionSuggestions.length > 0 && (
                                    <div className="absolute bottom-full mb-2 w-[calc(100%-2rem)] max-w-sm bg-coal-black border border-granite-gray/20 rounded-lg shadow-lg z-10 p-2 max-h-48 overflow-y-auto">
                                        {mentionSuggestions.map((user, index) => (
                                            <div
                                                key={user.id}
                                                onMouseDown={(e) => { e.preventDefault(); handleSelectMention(user); }}
                                                className={`flex items-center p-2 rounded cursor-pointer ${index === activeMentionIndex ? 'bg-granite-gray/20' : ''}`}
                                            >
                                                <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full mr-2" />
                                                <span className="text-sm font-semibold">{user.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="min-h-[20px] mb-2">{typingIndicator}</div>
                                {replyingTo && (
                                    <div className="mb-2 p-2 bg-black/30 rounded-lg flex items-center justify-between text-sm">
                                        <div className="min-w-0">
                                            <p className="text-xs text-granite-gray-light">Respondendo a <span className="font-semibold">{replyingTo.senderName}</span></p>
                                            <p className="truncate text-gray-300">{replyingTo.text || 'Anexo'}</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-white"><X size={16}/></button>
                                    </div>
                                )}
                                {attachment && (
                                    <div className="mb-2 p-2 bg-black/30 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center min-w-0">
                                            <FileIcon size={20} className="mr-2 flex-shrink-0 text-gray-400"/>
                                            <span className="text-sm text-gray-300 truncate">{attachment.name}</span>
                                        </div>
                                        <button onClick={() => setAttachment(null)} className="p-1 text-gray-400 hover:text-white"><X size={16}/></button>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                                    <button type="button" onClick={handleAttachmentClick} className="p-2.5 text-granite-gray-light hover:text-white rounded-full hover:bg-granite-gray/20">
                                        <Paperclip size={20} />
                                    </button>
                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={handleNewMessageChange}
                                        onKeyDown={(e) => {
                                            handleMentionKeyDown(e);
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        placeholder="Digite uma mensagem..."
                                        rows={1}
                                        className="flex-1 bg-black/30 border border-granite-gray/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow resize-none"
                                    />
                                    <button type="submit" className="p-2.5 bg-cadmium-yellow text-coal-black rounded-lg hover:brightness-110 disabled:opacity-50" disabled={!newMessage.trim() && !attachment}>
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-granite-gray">
                            <p>Selecione uma conversa para começar.</p>
                        </div>
                    )}
                </div>
            </div>
            {isNewChatModalOpen && (
                <NewChatModal
                    onClose={() => setIsNewChatModalOpen(false)}
                    onCreate={createChannel}
                    onChannelSelect={handleChannelSelect}
                />
            )}
            {messageToDelete && (
                <ConfirmDeleteModal
                    title="Excluir Mensagem"
                    message="Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita."
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setMessageToDelete(null)}
                />
            )}
            {isInfoPanelOpen && selectedChannel && (
                <ChannelInfoPanel
                    channel={selectedChannel}
                    onClose={() => setIsInfoPanelOpen(false)}
                />
            )}
        </>
    );
};