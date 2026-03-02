'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    created_at: string;
    stream_id: string;
    user_id: string;
    user_name: string;
    message: string;
}

interface LiveChatProps {
    streamId: string;
    currentUser: any;
    isModerator?: boolean;
}

export default function LiveChat({ streamId, currentUser, isModerator = false }: LiveChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [moderationMode, setModerationMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Fetch initial messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('live_chat')
                .select('*')
                .eq('stream_id', streamId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data || []);
                scrollToBottom();
            }
        };

        fetchMessages();

        // 2. Subscribe to real-time inserts & deletes
        const subscription = supabase
            .channel(`live_chat_${streamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'live_chat',
                    filter: `stream_id=eq.${streamId}`,
                },
                (payload) => {
                    setMessages((current) => [...current, payload.new as ChatMessage]);
                    scrollToBottom();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'live_chat',
                    filter: `stream_id=eq.${streamId}`,
                },
                (payload) => {
                    setMessages((current) => current.filter(msg => msg.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [streamId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageText = newMessage.trim();
        setNewMessage(''); // optimistic clear

        const { error } = await supabase.from('live_chat').insert([
            {
                stream_id: streamId,
                user_id: currentUser.id,
                user_name: currentUser.name || currentUser.email.split('@')[0], // Fallback if no name
                message: messageText,
            },
        ]);

        if (error) {
            console.error('Error sending message:', error);
            // Optional: add a toast notification here
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!isModerator) return;
        const { error } = await supabase.from('live_chat').delete().eq('id', messageId).eq('stream_id', streamId);
        if (error) console.error('Error deleting message:', error);
    };

    return (
        <div className="flex flex-col h-full absolute inset-0">
            {/* Header (optional if provided by parent, but we can add moderation toggle here) */}
            {isModerator && (
                <div className="bg-slate-900 border-b border-slate-800 p-2 flex justify-end">
                    <button
                        onClick={() => setModerationMode(!moderationMode)}
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${moderationMode ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        {moderationMode ? 'Exit Mod Mode ' : 'Mod Mode'}
                    </button>
                </div>
            )}

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm mt-10">
                        No messages yet. Be the first to say hi!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="text-sm group flex items-start justify-between">
                            <div>
                                <span className="font-semibold text-blue-600 mr-2">{msg.user_name}:</span>
                                <span className="text-foreground">{msg.message}</span>
                            </div>
                            {moderationMode && (
                                <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded transition-all shrink-0 ml-2"
                                    title="Delete Message"
                                >
                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Send a message..."
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
