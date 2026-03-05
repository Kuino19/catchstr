'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
}

interface TrendingTag {
    tag: string;
    count: number;
}

interface SearchResult {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
}

export default function RightSidebar() {
    const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [followStatuses, setFollowStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        async function fetchSidebarData() {
            const { data: { session } } = await supabase.auth.getSession();
            const myId = session?.user?.id || null;
            setCurrentUserId(myId);

            // Fetch suggested profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .neq('id', myId || '')
                .limit(3);

            if (data && !error) {
                const profiles = data as Profile[];
                setSuggestedProfiles(profiles);

                if (myId) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('following_id, status')
                        .eq('follower_id', myId)
                        .in('following_id', profiles.map(p => p.id));

                    const statusMap: Record<string, 'none' | 'pending' | 'accepted'> = {};
                    followData?.forEach(f => { statusMap[f.following_id] = f.status; });
                    setFollowStatuses(statusMap);
                }
            }

            // ✅ Fetch dynamic trending hashtags from actual posts content
            const { data: recentPosts } = await supabase
                .from('posts')
                .select('content')
                .order('created_at', { ascending: false })
                .limit(200);

            if (recentPosts) {
                const tagCounts: Record<string, number> = {};
                for (const post of recentPosts) {
                    const matches = post.content?.match(/#\w+/g) || [];
                    for (const tag of matches) {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                }

                const sorted = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([tag, count]) => ({ tag, count }));

                // If no real tags found, show curated defaults
                if (sorted.length > 0) {
                    setTrendingTags(sorted);
                } else {
                    setTrendingTags([
                        { tag: '#TopBins', count: 124 },
                        { tag: '#ScoutMe', count: 81 },
                        { tag: '#MatchDay', count: 52 },
                        { tag: '#FootballTalent', count: 39 },
                    ]);
                }
            }

            setLoading(false);
        }
        fetchSidebarData();
    }, []);

    const handleFollow = async (profileId: string) => {
        if (!currentUserId) return;
        const currentStatus = followStatuses[profileId] || 'none';
        if (currentStatus !== 'none') return;

        setFollowStatuses(prev => ({ ...prev, [profileId]: 'pending' }));

        const { error } = await supabase
            .from('follows')
            .insert([{ follower_id: currentUserId, following_id: profileId, status: 'pending' }]);

        if (!error) {
            await supabase.from('notifications').insert([{
                user_id: profileId,
                actor_id: currentUserId,
                type: 'follow'
            }]);
        }
    };

    const formatTagCount = (count: number) => {
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return count.toString();
    };

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!q.trim()) { setSearchResults([]); return; }
        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .ilike('full_name', `%${q.trim()}%`)
                .limit(5);
            setSearchResults((data as SearchResult[]) ?? []);
            setIsSearching(false);
        }, 300);
    };

    return (
        <aside className="hidden xl:flex flex-col w-80 h-screen sticky top-0 px-6 py-8 bg-background-light dark:bg-background-dark overflow-y-auto border-l border-slate-200 dark:border-slate-800">
            {/* Search Bar with live results */}
            <div className="relative mb-8">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">search</span>
                <input
                    type="text"
                    placeholder="Search catchstr"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onBlur={() => setTimeout(() => setSearchResults([]), 200)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white"
                />
                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || isSearching) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                        {isSearching ? (
                            <div className="p-3 text-center">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : (
                            searchResults.map(result => (
                                <Link key={result.id} href={`/profile/${result.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative shrink-0">
                                        {result.avatar_url ? (
                                            <Image src={result.avatar_url} alt={result.full_name} fill className="object-cover" sizes="32px" />
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-400 text-sm flex items-center justify-center h-full w-full">person</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{result.full_name}</p>
                                        <p className="text-xs text-slate-500">{result.role}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ✅ Dynamic Trending Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/50 mb-8">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Trending For You</h2>
                <div className="flex flex-col gap-5">
                    {trendingTags.map((tag) => (
                        <Link key={tag.tag} href={`/discover?q=${tag.tag.slice(1)}`} className="group">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-tight">Trending in Sports</p>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{tag.tag}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formatTagCount(tag.count)} posts</p>
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
                                        {/* ✅ Next.js Image for optimized avatar loading */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 relative shrink-0">
                                            {profile.avatar_url ? (
                                                <Image
                                                    src={profile.avatar_url}
                                                    alt={profile.full_name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
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
