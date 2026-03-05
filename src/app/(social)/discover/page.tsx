'use client';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import PostCard from '@/components/PostCard';
import { supabase } from '@/lib/supabase';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    location: string;
    avatar_url: string;
}

interface Post {
    id: string;
    content: string;
    media_url: string;
    likes_count: number;
    created_at: string;
    profiles: Profile;
    tags?: string[];
}

export default function DiscoverPage() {
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'Trending' | 'Recent' | 'Search'>('Trending');
    const [topTalent, setTopTalent] = useState<Profile | null>(null);

    // Filters
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

    // Basic mock trending tags for the top scroll picker
    const trendingTags = ['#TopBins', '#Training', '#MatchDay', '#Goalkeeper', '#ScoutMe'];

    useEffect(() => {
        async function fetchDiscoverData() {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, position, location, avatar_url')
                    .eq('id', session.user.id)
                    .single();
                if (profile) setCurrentUserProfile(profile as Profile);
            }

            // Build Query
            let query = supabase.from('posts').select('id, content, media_url, likes_count, created_at, tags, profiles:author_id (id, full_name, role, position, location, avatar_url)');

            if (selectedRole) {
                query = query.eq('profiles.role', selectedRole);
            }
            if (selectedPosition) {
                query = query.eq('profiles.position', selectedPosition);
            }

            if (searchQuery.trim() !== '') {
                // If searching, trigger an ILIKE query against tags or content
                query = query.or(`content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
                setActiveTab('Search');
            } else if (activeTab === 'Trending') {
                // Order by likes
                query = query.order('likes_count', { ascending: false }).limit(20);
            } else if (activeTab === 'Recent') {
                // Order by created_at
                query = query.order('created_at', { ascending: false }).limit(20);
            }

            const { data, error } = await query;

            if (data && !error) {
                setPosts(data as unknown as Post[]);
            }

            const { data: topTalentData } = await supabase
                .from('posts')
                .select(`author_id, likes_count, profiles:author_id (*)`)
                .order('likes_count', { ascending: false })
                .limit(1)
                .single();

            if (topTalentData) {
                setTopTalent(topTalentData.profiles as any);
            }

            setLoading(false);
        }

        // Slight debounce for searching
        const timeoutId = setTimeout(() => {
            fetchDiscoverData();
        }, 400);

        return () => clearTimeout(timeoutId);

    }, [searchQuery, activeTab, selectedRole, selectedPosition]);

    const positions = ['Striker', 'Midfielder', 'Defender', 'Goalkeeper', 'Winger', 'Coach'];

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20 font-display">
            {/* Header with Search */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Discover</h1>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Search tags, players, or posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-500 transition-all font-medium"
                    />
                </div>
            </header>

            {/* Tags / Tabs Rail */}
            {!searchQuery && (
                <div className="border-b border-slate-200 dark:border-slate-800">
                    <div className="flex px-4 py-3 gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('Trending')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'Trending' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                        >
                            🔥 Trending
                        </button>
                        <button
                            onClick={() => setActiveTab('Recent')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'Recent' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                        >
                            🕒 Recent
                        </button>
                        {trendingTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setSearchQuery(tag)}
                                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary whitespace-nowrap"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="flex px-4 pb-3 gap-3 overflow-x-auto no-scrollbar">
                        <select
                            onChange={(e) => setSelectedRole(e.target.value || null)}
                            className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-1 focus:ring-primary min-w-[100px]"
                        >
                            <option value="">All Roles</option>
                            <option value="Player">Players</option>
                            <option value="Agent">Agents</option>
                        </select>

                        <div className="flex gap-1.5">
                            {positions.map(pos => (
                                <button
                                    key={pos}
                                    onClick={() => setSelectedPosition(selectedPosition === pos ? null : pos)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${selectedPosition === pos
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid / Feed */}
            <main className="flex flex-col gap-6 pt-4">
                {/* Talent of the Week Spotlight */}
                {topTalent && activeTab === 'Trending' && !searchQuery && (
                    <div className="px-4">
                        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-3xl p-5 shadow-xl shadow-amber-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-8xl text-white">workspace_premium</span>
                            </div>
                            <div className="relative z-10 flex gap-4 items-center">
                                <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-white/50 shadow-lg">
                                    {topTalent.avatar_url ? (
                                        <img src={topTalent.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/20">
                                            <span className="material-symbols-outlined text-white text-3xl">person</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter backdrop-blur-sm">
                                            Talent of the Week
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-white leading-tight">{topTalent.full_name}</h3>
                                    <p className="text-white/80 text-xs font-bold font-mono">{topTalent.position} • {topTalent.location}</p>
                                    <button
                                        onClick={() => (window.location.href = `/profile/${topTalent.id}`)}
                                        className="mt-3 bg-white text-amber-600 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
                        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                        <p>No results found.</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={currentUserProfile?.id || null}
                        />
                    ))
                )}
            </main>

            <BottomNav />
        </div>
    );
}
