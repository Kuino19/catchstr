'use client';
import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string | null;
    audio_url?: string;
    created_at: string;
}

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: recipientId } = use(params);
    const router = useRouter();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [recipient, setRecipient] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRecipientTyping, setIsRecipientTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const subscriptionRef = useRef<any>(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        async function loadChat() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            const myId = session.user.id;
            setCurrentUserId(myId);

            // Fetch recipient profile
            const { data: recipientData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .eq('id', recipientId)
                .single();

            if (recipientData) {
                setRecipient(recipientData as Profile);
            }

            // Fetch chat history between the two users
            const { data: messagesData, error } = await supabase
                .from('messages')
                .select('id, sender_id, receiver_id, content, audio_url, created_at')
                .or(`and(sender_id.eq.${myId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${myId})`)
                .order('created_at', { ascending: true });

            if (messagesData && !error) {
                setMessages(messagesData as Message[]);
            }

            setLoading(false);

            // Set up Realtime Subscription
            subscriptionRef.current = supabase.channel(`chat:${myId}-${recipientId}`, {
                config: {
                    presence: {
                        key: myId,
                    },
                },
            })
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload) => {
                        const newMsg = payload.new as Message;
                        if (newMsg.sender_id === recipientId && newMsg.receiver_id === myId) {
                            setMessages((prev) => [...prev, newMsg]);
                        }
                    }
                )
                .on('presence', { event: 'sync' }, () => {
                    const state = subscriptionRef.current.presenceState();
                    const otherUserPresence: any = state[recipientId];
                    if (otherUserPresence && otherUserPresence[0]?.isTyping) {
                        setIsRecipientTyping(true);
                    } else {
                        setIsRecipientTyping(false);
                    }
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    if (key === recipientId && newPresences[0]?.isTyping) {
                        setIsRecipientTyping(true);
                    }
                })
                .on('presence', { event: 'leave' }, ({ key }) => {
                    if (key === recipientId) {
                        setIsRecipientTyping(false);
                    }
                })
                .subscribe();
        }

        loadChat();

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, [recipientId, router]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioUpload(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Recording error:", err);
            toast.error('Could not access microphone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleAudioUpload = async (blob: Blob) => {
        if (!currentUserId) return;

        try {
            const fileName = `${currentUserId}/${Date.now()}.webm`;
            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);

            const { error: insertError } = await supabase
                .from('messages')
                .insert([
                    {
                        sender_id: currentUserId,
                        receiver_id: recipientId,
                        audio_url: publicUrl,
                        content: null
                    }
                ]);

            if (insertError) throw insertError;

            // Notification
            await supabase.from('notifications').insert([{
                user_id: recipientId,
                actor_id: currentUserId,
                type: 'message'
            }]);

        } catch (err) {
            console.error("Audio upload failed:", err);
            toast.error('Failed to send voice message.');
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUserId) return;

        const contentToInsert = newMessage.trim();
        const tempId = crypto.randomUUID();
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: currentUserId,
            receiver_id: recipientId,
            content: contentToInsert,
            created_at: new Date().toISOString()
        };

        // 1. Optimistic Update
        setMessages((prev) => [...prev, optimisticMsg]);
        setNewMessage('');

        // 2. Stop typing status
        if (subscriptionRef.current) {
            subscriptionRef.current.track({ isTyping: false });
        }

        // 2. Database Insert
        const { error } = await supabase
            .from('messages')
            .insert([
                {
                    sender_id: currentUserId,
                    receiver_id: recipientId,
                    content: contentToInsert
                }
            ]);

        if (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            toast.error('Failed to send message. Please try again.');
        } else {
            // Also insert a notification for the recipient
            await supabase.from('notifications').insert([{
                user_id: recipientId,
                actor_id: currentUserId,
                type: 'message'
            }]);
        }
    };

    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

    const toggleAudio = (id: string) => {
        const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
        if (!audio) return;

        if (playingAudioId === id) {
            audio.pause();
            setPlayingAudioId(null);
        } else {
            // Stop current playing
            if (playingAudioId) {
                const current = document.getElementById(`audio-${playingAudioId}`) as HTMLAudioElement;
                if (current) current.pause();
            }
            audio.play();
            setPlayingAudioId(id);
            audio.onended = () => setPlayingAudioId(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white h-screen flex flex-col">
            {/* Header */}
            <header className="flex-none px-4 py-3 flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-divider dark:border-slate-800 z-10 shadow-sm sticky top-0">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>

                {recipient ? (
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => router.push(`/profile/${recipient.id}`)}>
                        <div className="relative">
                            {recipient.avatar_url ? (
                                <img src={recipient.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold flex items-center gap-1 text-slate-900 dark:text-white">
                                {recipient.full_name || 'User'}
                                {recipient.role === 'Agent' && <span className="material-symbols-outlined text-primary text-[14px] filled">verified</span>}
                            </h2>
                            <p className="text-[10px] text-slate-500">
                                {isRecipientTyping ? (
                                    <span className="text-primary font-bold animate-pulse">Typing...</span>
                                ) : (
                                    'Active now'
                                )}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1">
                        <h2 className="text-sm font-bold">Chat</h2>
                    </div>
                )}

                <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <span className="material-symbols-outlined text-[24px]">more_vert</span>
                </button>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-slate-50 dark:bg-background-dark">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 opacity-60">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl">waving_hand</span>
                        </div>
                        <p className="font-medium text-sm">Say hello to {recipient?.full_name?.split(' ')[0] || 'them'}!</p>
                        <p className="text-xs mt-1">Start networking to build your career.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUserId;
                            return (
                                <div key={msg.id || i} className={`max-w-[80%] flex ${isMe ? 'self-end' : 'self-start'}`}>
                                    <div className={`
                                        px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm
                                        ${isMe
                                            ? 'bg-primary text-white rounded-br-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700/50'
                                        }
                                    `}>
                                        {msg.audio_url ? (
                                            <div className="flex items-center gap-3 py-1 min-w-[200px] cursor-pointer" onClick={() => toggleAudio(msg.id)}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                    <span className={`material-symbols-outlined text-[20px] ${isMe ? 'text-white' : 'text-primary'}`}>
                                                        {playingAudioId === msg.id ? 'pause' : 'play_arrow'}
                                                    </span>
                                                </div>
                                                <audio src={msg.audio_url} className="hidden" id={`audio-${msg.id}`} />
                                                <div className="flex-1 h-1 bg-current opacity-20 rounded-full relative">
                                                    <div className={`absolute inset-0 bg-current rounded-full transition-all duration-300 ${playingAudioId === msg.id ? 'animate-pulse' : ''}`} style={{ width: playingAudioId === msg.id ? '60%' : '0%' }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold opacity-70">Voice</span>
                                            </div>
                                        ) : (
                                            <p>{msg.content}</p>
                                        )}
                                        <div className={`text-[9px] mt-1.5 font-medium ${isMe ? 'text-primary-100/70 text-right' : 'text-slate-400 dark:text-slate-500 text-left'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Input Area */}
            <footer className="flex-none p-3 bg-white dark:bg-slate-900 border-t border-divider dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
                    {!isRecording ? (
                        <>
                            <button type="button" className="p-2.5 text-slate-400 hover:text-primary transition-colors flex-shrink-0 mb-0.5">
                                <span className="material-symbols-outlined text-[24px]">add_circle</span>
                            </button>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center relative min-h-[44px]">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        if (subscriptionRef.current) {
                                            subscriptionRef.current.track({ isTyping: e.target.value.length > 0 });
                                        }
                                    }}
                                    placeholder="Message..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 px-4 py-3 text-sm h-full"
                                />
                            </div>
                            {newMessage.trim() ? (
                                <button
                                    type="submit"
                                    className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm flex-shrink-0 animate-in zoom-in duration-200"
                                >
                                    <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="p-2.5 text-slate-400 hover:text-primary transition-colors flex-shrink-0 mb-0.5"
                                >
                                    <span className="material-symbols-outlined text-[24px]">mic</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-bold text-red-500">{formatDuration(recordingTime)}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 italic">Recording...</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRecording(false)} // Simply cancel
                                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">stop</span>
                            </button>
                        </div>
                    )}
                </form>
            </footer>
        </div>
    );
}
