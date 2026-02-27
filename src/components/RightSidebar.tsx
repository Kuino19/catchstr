'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
}

export default function RightSidebar() {
    const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [followStatuses, setFollowStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});

    useEffect(() => {
        async function fetchSuggestions() {
            const { data: { session } } = await supabase.auth.getSession();
            const myId = session?.user?.id || null;
            setCurrentUserId(myId);

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .neq('id', myId || '')
                .limit(3);

            if (data && !error) {
                const profiles = data as Profile[];
                setSuggestedProfiles(profiles);

                // Fetch follow statuses for these profiles
                if (myId) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('following_id, status')
                        .eq('follower_id', myId)
                        .in('following_id', profiles.map(p => p.id));

                    const statusMap: Record<string, 'none' | 'pending' | 'accepted'> = {};
                    followData?.forEach(f => {
                        statusMap[f.following_id] = f.status;
                    });
                    setFollowStatuses(statusMap);
                }
            }
            setLoading(false);
        }
        fetchSuggestions();
    }, []);

    const handleFollow = async (profileId: string) => {
        if (!currentUserId) return;

        const currentStatus = followStatuses[profileId] || 'none';
        if (currentStatus !== 'none') return; // For now, only handle initial follow from sidebar

        setFollowStatuses(prev => ({ ...prev, [profileId]: 'pending' }));

        const { error } = await supabase
            .from('follows')
            .insert([{
                follower_id: currentUserId,
                following_id: profileId,
                status: 'pending'
            }]);

        if (!error) {
            await supabase.from('notifications').insert([{
                user_id: profileId,
                actor_id: currentUserId,
                type: 'follow'
            }]);
        }
    };

    const trendingTags = [
        { name: '#TopBins', count: '12.4k' },
        { name: '#ScoutMe', count: '8.1k' },
        { name: '#MatchDay', count: '5.2k' },
        { name: '#FootballTalent', count: '3.9k' },
    ];

    return (
        <aside className="hidden xl:flex flex-col w-80 h-screen sticky top-0 px-6 py-8 bg-background-light dark:bg-background-dark overflow-y-auto border-l border-slate-200 dark:border-slate-800">
            {/* Search Bar */}
            <div className="relative mb-8">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                    type="text"
                    placeholder="Search catchstr"
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white"
                />
            </div>

            {/* Trending Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/50 mb-8">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Trending For You</h2>
                <div className="flex flex-col gap-5">
                    {trendingTags.map((tag) => (
                        <Link key={tag.name} href={`/discover?q=${tag.name.slice(1)}`} className="group">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-tight">Trending in Sports</p>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{tag.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{tag.count} posts</p>
                        </Link>
                    ))}
                </div>
                <Link href="/discover" className="block mt-6 text-sm font-bold text-primary hover:underline">
                    Show more
                </Link>
            </div>

            {/* Suggested Profiles */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/50">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Who to follow</h2>
                <div className="flex flex-col gap-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>)
                    ) : (
                        suggestedProfiles.map((profile) => {
                            const status = followStatuses[profile.id] || 'none';
                            return (
                                <div key={profile.id} className="flex items-center justify-between group">
                                    <Link href={`/profile/${profile.id}`} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col max-w-[100px]">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile.full_name}</p>
                                            <p className="text-[10px] font-medium text-slate-500 uppercase">{profile.role}</p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => handleFollow(profile.id)}
                                        disabled={status !== 'none'}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${status === 'accepted'
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 pointer-events-none'
                                            : status === 'pending'
                                                ? 'bg-primary/10 text-primary cursor-default'
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-80'
                                            }`}
                                    >
                                        {status === 'accepted' ? 'Following' : status === 'pending' ? 'Requested' : 'Follow'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
                <Link href="/chat" className="block mt-6 text-sm font-bold text-primary hover:underline">
                    Find more
                </Link>
            </div>

            {/* Tiny Footer */}
            <div className="mt-8 px-4 flex flex-wrap gap-x-4 gap-y-2 opacity-40 hover:opacity-100 transition-opacity">
                <Link href="/legal/terms" className="text-[10px] font-medium hover:underline">Terms</Link>
                <Link href="/legal/privacy" className="text-[10px] font-medium hover:underline">Privacy</Link>
                <span className="text-[10px] font-medium">© 2026 catchstr</span>
            </div>
        </aside>
    );
}
