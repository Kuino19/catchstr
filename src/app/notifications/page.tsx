'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    is_read: boolean;
    created_at: string;
    actor_id: string;
    post_id?: string;
    actor?: {
        full_name: string;
        avatar_url: string;
    };
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    id,
                    type,
                    is_read,
                    created_at,
                    actor_id,
                    post_id,
                    profiles!notifications_actor_id_fkey (full_name, avatar_url)
                `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (data && !error) {
                const formatted = data.map((n: any) => ({
                    ...n,
                    actor: n.profiles
                }));
                setNotifications(formatted);

                // Mark all as read
                const unreadIds = formatted.filter((n: Notification) => !n.is_read).map((n: Notification) => n.id);
                if (unreadIds.length > 0) {
                    await supabase
                        .from('notifications')
                        .update({ is_read: true })
                        .in('id', unreadIds);
                }
            }
            setLoading(false);
        }

        fetchNotifications();
    }, [router]);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const getNotificationText = (type: string, actorName: string) => {
        switch (type) {
            case 'follow': return <span className="text-sm"><span className="font-bold text-slate-900 dark:text-white">{actorName}</span> sent you a connection request.</span>;
            case 'follow_accepted': return <span className="text-sm">You accepted <span className="font-bold text-slate-900 dark:text-white">{actorName}</span>'s request.</span>;
            case 'like': return <span className="text-sm"><span className="font-bold text-slate-900 dark:text-white">{actorName}</span> liked your highlight.</span>;
            case 'message': return <span className="text-sm"><span className="font-bold text-slate-900 dark:text-white">{actorName}</span> sent you a message.</span>;
            default: return <span className="text-sm"><span className="font-bold text-slate-900 dark:text-white">{actorName}</span> interacted with your profile.</span>;
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'follow': return <span className="material-symbols-outlined text-primary text-[18px]">person_add</span>;
            case 'follow_accepted': return <span className="material-symbols-outlined text-pitch-green text-[18px]">check_circle</span>;
            case 'like': return <span className="material-symbols-outlined text-red-500 text-[18px] filled">favorite</span>;
            case 'message': return <span className="material-symbols-outlined text-blue-500 text-[18px]">chat_bubble</span>;
            default: return <span className="material-symbols-outlined text-slate-500 text-[18px]">notifications</span>;
        }
    };

    const handleAcceptFollow = async (notif: Notification) => {
        // Update follow status
        const { error: followError } = await supabase
            .from('follows')
            .update({ status: 'accepted' })
            .eq('follower_id', notif.actor_id)
            .eq('following_id', (await supabase.auth.getUser()).data.user?.id);

        if (!followError) {
            // Update local state to remove action buttons or update text
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, type: 'follow_accepted' } : n));
        }
    };

    const handleDeclineFollow = async (notif: Notification) => {
        // Delete follow record
        const { error: followError } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', notif.actor_id)
            .eq('following_id', (await supabase.auth.getUser()).data.user?.id);

        if (!followError) {
            // Delete notification as well or update local state
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
            await supabase.from('notifications').delete().eq('id', notif.id);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20 font-display">
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()} className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Notifications</h1>
            </header>

            <main className="flex flex-col pt-2 max-w-2xl mx-auto w-full">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-24 px-8 text-center opacity-60">
                        <span className="material-symbols-outlined text-5xl mb-3 text-slate-400">notifications_off</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Notifications</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any notifications right now.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id} className={`flex items-start gap-4 p-4 border-b border-slate-100 dark:border-slate-800/50 ${!notif.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                            <Link href={`/profile/${notif.actor_id}`} className="relative shrink-0">
                                {notif.actor?.avatar_url ? (
                                    <img src={notif.actor.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="Actor Avatar" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-400">person</span>
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                                    {getNotificationIcon(notif.type)}
                                </div>
                            </Link>
                            <div className="flex flex-col flex-1 pt-0.5">
                                {notif.type === 'follow' ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            {getNotificationText(notif.type, notif.actor?.full_name || 'Someone')}
                                            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{formatTimeAgo(notif.created_at)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptFollow(notif)}
                                                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDeclineFollow(notif)}
                                                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {getNotificationText(notif.type, notif.actor?.full_name || 'Someone')}
                                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{formatTimeAgo(notif.created_at)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>

            <BottomNav />
        </div>
    );
}
