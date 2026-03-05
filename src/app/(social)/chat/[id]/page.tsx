'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DirectMessagePage() {
    const params = useParams();
    const receiverId = params?.id as string;
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [receiver, setReceiver] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        async function fetchInitialData() {
            if (!receiverId) return;
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setCurrentUser(session.user);

            // Fetch receiver profile
            const { data: receiverData } = await supabase
                .from('profiles')
                .select('id, full_name, role, position, avatar_url')
                .eq('id', receiverId)
                .single();

            if (receiverData) {
                setReceiver(receiverData);
            }

            // Fetch REAL conversation history
            const { data: messageData, error } = await supabase
                .from('messages')
                .select('id, sender_id, receiver_id, content, created_at')
                .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
                .order('created_at', { ascending: true });

            if (messageData) {
                setMessages(messageData);
            }

            setLoading(false);
        }

        fetchInitialData();
    }, [receiverId, router]);

    // Realtime subscriptions for incoming messages
    useEffect(() => {
        if (!currentUser || !receiverId) return;

        const channel = supabase
            .channel(`direct_messages_${currentUser.id}_${receiverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    // Only add if it's from current chat window
                    if (payload.new.sender_id === receiverId) {
                        setMessages(prev => [...prev, payload.new]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, receiverId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !receiverId) return;

        const messageText = newMessage;
        setNewMessage(''); // Clear input

        // Optimistically add the message to the UI
        const optimisticMsg = {
            id: Date.now().toString(), // temporary
            sender_id: currentUser.id,
            receiver_id: receiverId,
            content: messageText,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        // Insert into real 'messages' table
        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: receiverId,
                content: messageText
            });

        if (error) {
            console.error("Error sending message", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-900 font-display">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4 sticky top-0 z-10 shrink-0 shadow-sm">
                <Link href="/chat" className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                        {receiver?.avatar_url ? (
                            <img src={receiver?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">{receiver?.full_name || 'Anonymous User'}</h2>
                        <p className="text-xs text-primary font-medium">{receiver?.role || 'Player'}</p>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex flex-col items-center py-6">
                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-3">
                        {receiver?.avatar_url ? (
                            <img src={receiver?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-4xl">person</span>
                            </div>
                        )}
                    </div>
                    <h3 className="font-bold text-lg">{receiver?.full_name || 'Anonymous User'}</h3>
                    <p className="text-sm text-slate-500">{receiver?.role || 'Player'} {receiver?.position ? `• ${receiver.position}` : ''}</p>
                    <p className="text-xs text-slate-400 mt-2">This is the beginning of your direct message history.</p>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm'}`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shrink-0 pb-safe">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-slate-200 dark:border-slate-700"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
