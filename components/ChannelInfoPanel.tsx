import React, { useState, useMemo, useEffect } from 'react';
import { ChatChannel, ChatMessage, User, ChannelType, ChatAttachment } from '../types';
import { useAppContext } from './AppContext';
import { X, Users, Image as ImageIcon, FileText as FileIcon, Link as LinkIcon, Download } from 'lucide-react';

interface ChannelInfoPanelProps {
  channel: ChatChannel;
  onClose: () => void;
}

type PanelTab = 'members' | 'media' | 'files' | 'links';

const TabButton: React.FC<{ icon: React.ReactNode, label: string, count: number, isActive: boolean, onClick: () => void }> = ({ icon, label, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
      isActive
        ? 'text-cadmium-yellow border-cadmium-yellow'
        : 'text-granite-gray-light border-transparent hover:text-white'
    }`}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
    <span className={`px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-cadmium-yellow/20 text-cadmium-yellow' : 'bg-granite-gray/20 text-granite-gray-light'}`}>{count}</span>
  </button>
);

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ChannelInfoPanel: React.FC<ChannelInfoPanelProps> = ({ channel, onClose }) => {
    const { messages, users, currentUser } = useAppContext();
    const [activeTab, setActiveTab] = useState<PanelTab>(channel.type === ChannelType.Group ? 'members' : 'media');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const channelMessages = useMemo(() => messages.filter(m => m.channelId === channel.id), [messages, channel.id]);

    const mediaItems = useMemo(() => channelMessages
        .map(m => m.attachment)
        .filter((att): att is ChatAttachment => !!att && (att.type.startsWith('image/') || att.type.startsWith('video/'))), [channelMessages]);

    const fileItems = useMemo(() => channelMessages
        .map(m => m.attachment)
        .filter((att): att is ChatAttachment => !!att && !att.type.startsWith('image/') && !att.type.startsWith('video/')), [channelMessages]);

    const linkItems = useMemo(() => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links: { url: string, message: ChatMessage }[] = [];
        channelMessages.forEach(message => {
            const found = message.text?.match(urlRegex);
            if (found) {
                found.forEach(url => links.push({ url, message }));
            }
        });
        return links.reverse(); // Show most recent first
    }, [channelMessages]);

    const members = useMemo(() => {
        return channel.members.map(memberId => users.find(u => u.id === memberId)).filter((u): u is User => !!u);
    }, [channel.members, users]);
    
    const getChannelDisplayName = () => {
        if (channel.type === ChannelType.Private) {
            const otherMemberId = channel.members.find(id => id !== currentUser?.id);
            return users.find(u => u.id === otherMemberId)?.name || 'Conversa';
        }
        return channel.name;
    };


    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 panel-backdrop-animation" onClick={onClose}></div>
            <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-coal-black shadow-2xl border-l border-granite-gray/20 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-granite-gray/20">
                    <h2 className="text-lg font-bold text-white truncate">Informações de "{getChannelDisplayName()}"</h2>
                    <button onClick={onClose} className="p-2 text-granite-gray-light rounded-full hover:bg-granite-gray/20"><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 border-b border-granite-gray/20 flex items-center justify-around">
                    {channel.type === ChannelType.Group && (
                        <TabButton icon={<Users size={16}/>} label="Membros" count={members.length} isActive={activeTab === 'members'} onClick={() => setActiveTab('members')} />
                    )}
                    <TabButton icon={<ImageIcon size={16}/>} label="Mídia" count={mediaItems.length} isActive={activeTab === 'media'} onClick={() => setActiveTab('media')} />
                    <TabButton icon={<FileIcon size={16}/>} label="Arquivos" count={fileItems.length} isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} />
                    <TabButton icon={<LinkIcon size={16}/>} label="Links" count={linkItems.length} isActive={activeTab === 'links'} onClick={() => setActiveTab('links')} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'members' && channel.type === ChannelType.Group && (
                        <div className="space-y-3">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center p-2 bg-granite-gray/10 rounded-lg">
                                    <img src={member.picture} alt={member.name} className="w-8 h-8 rounded-full mr-3"/>
                                    <div>
                                        <p className="font-semibold text-white">{member.name}</p>
                                        <p className="text-xs text-cadmium-yellow">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                     {activeTab === 'media' && (
                        mediaItems.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {mediaItems.map((item, index) => (
                                    <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="aspect-square bg-black/30 rounded-lg overflow-hidden group">
                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                                    </a>
                                ))}
                            </div>
                        ) : (<div className="text-center text-granite-gray pt-10">Nenhuma mídia compartilhada.</div>)
                    )}
                    {activeTab === 'files' && (
                        fileItems.length > 0 ? (
                            <div className="space-y-2">
                                {fileItems.map((item, index) => (
                                    <a key={index} href={item.url} download={item.name} className="flex items-center p-2 rounded-lg bg-granite-gray/10 hover:bg-granite-gray/20">
                                        <FileIcon size={24} className="mr-3 flex-shrink-0 text-gray-400" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm truncate text-white">{item.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                                        </div>
                                        <Download size={18} className="ml-auto flex-shrink-0 text-gray-400" />
                                    </a>
                                ))}
                            </div>
                        ) : (<div className="text-center text-granite-gray pt-10">Nenhum arquivo compartilhado.</div>)
                    )}
                     {activeTab === 'links' && (
                        linkItems.length > 0 ? (
                            <div className="space-y-3">
                                {linkItems.map((item, index) => (
                                    <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-granite-gray/10 hover:bg-granite-gray/20">
                                        <p className="font-semibold text-sm truncate text-blue-300 underline">{item.url}</p>
                                        <p className="text-xs text-gray-400 mt-1">por {item.message.senderName} em {new Date(item.message.timestamp).toLocaleDateString('pt-BR')}</p>
                                    </a>
                                ))}
                            </div>
                        ) : (<div className="text-center text-granite-gray pt-10">Nenhum link compartilhado.</div>)
                    )}
                </div>
            </div>
        </div>
    );
};