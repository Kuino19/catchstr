'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

interface Notification {
    id: string;
    type: 'follow' | 'like' | 'message';
    is_read: boolean;
    created_at: string;
    actor: {
        id: string;
        full_name: string;
        avatar_url: string;
    };
    post_id?: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    id,
                    type,
                    is_read,
                    created_at,
                    post_id,
                    actor:actor_id (id, full_name, avatar_url)
                `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setNotifications(data as any);
            }
            setLoading(false);
        }

        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'follow': return 'person_add';
            case 'like': return 'favorite';
            case 'message': return 'chat';
            default: return 'notifications';
        }
    };

    const getMessage = (notif: Notification) => {
        switch (notif.type) {
            case 'follow': return 'started following you';
            case 'like': return 'liked your highlight';
            case 'message': return 'sent you a message';
            default: return 'sent a notification';
        }
    };

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white pb-24 min-h-screen">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-divider dark:border-slate-800 px-6 py-4">
                <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
            </header>

            <main className="max-w-xl mx-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-20 px-8 text-center opacity-40">
                        <span className="material-symbols-outlined text-6xl mb-4">notifications_off</span>
                        <p className="text-sm font-medium">No notifications yet. When someone interacts with you, it'll show up here.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <Link
                            key={notif.id}
                            href={notif.type === 'message' ? `/chat/${notif.actor.id}` : notif.type === 'like' ? '/' : `/profile/${notif.actor.id}`}
                            className={`flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                        >
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {notif.actor.avatar_url ? (
                                        <img src={notif.actor.avatar_url} className="w-full h-full object-cover" alt="Actor" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-400">person</span>
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[14px] text-white shadow-sm border-2 border-white dark:border-slate-800 ${notif.type === 'like' ? 'bg-red-500' : notif.type === 'follow' ? 'bg-pitch-green' : 'bg-primary'
                                    }`}>
                                    <span className="material-symbols-outlined text-[14px] filled">{getIcon(notif.type)}</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-sm font-medium leading-snug">
                                    <span className="font-bold">{notif.actor.full_name}</span> {getMessage(notif)}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                                    {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                            </div>

                            {!notif.is_read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                        </Link>
                    ))
                )}
            </main>

            <BottomNav active="notifications" />
        </div>
    );
}
