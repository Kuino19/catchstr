'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LiveRings() {
    const [liveUsers, setLiveUsers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch initially
        fetchLiveUsers();

        // Subscribe to changes in active_streams
        const channel = supabase.channel('public:active_streams')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_streams' }, () => {
                fetchLiveUsers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchLiveUsers = async () => {
        const { data: activeStreams } = await supabase
            .from('active_streams')
            .select('*')
            .eq('status', 'live')
            .order('created_at', { ascending: false });

        if (activeStreams && activeStreams.length > 0) {
            const userIds = activeStreams.map((s: any) => s.user_id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, name')
                .in('id', userIds);

            if (profiles) {
                const profilesMap = new Map(profiles.map((p: any) => [p.id, p]));
                const merged = activeStreams.map((stream: any) => ({
                    ...stream,
                    profile: profilesMap.get(stream.user_id)
                })).filter((s: any) => s.profile);

                setLiveUsers(merged);
            } else {
                setLiveUsers([]);
            }
        } else {
            setLiveUsers([]);
        }
    };

    if (liveUsers.length === 0) return null;

    return (
        <div className="mt-8 mb-4 px-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Live Now
            </h3>
            <div className="flex flex-col gap-4">
                {liveUsers.map((liveUser) => (
                    <Link
                        key={liveUser.id}
                        href={`/live/${liveUser.profile.username}`}
                        className="flex items-center gap-3 group"
                    >
                        <div className="relative">
                            {/* Glowing Ring */}
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 animate-pulse opacity-75 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative w-10 h-10 rounded-full bg-slate-900 border-2 border-background-light dark:border-background-dark overflow-hidden z-10">
                                <img
                                    src={liveUser.profile.avatar_url || `https://ui-avatars.com/api/?name=${liveUser.profile.username}`}
                                    alt={liveUser.profile.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-red-500 transition-colors">
                                {liveUser.profile.name || liveUser.profile.username}
                            </p>
                            <p className="text-xs text-red-500 font-medium">Listening...</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
