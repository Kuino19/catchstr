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
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (profile) setCurrentUserProfile(profile as Profile);
            }

            // Build Query
            let query = supabase.from('posts').select(`*, profiles:author_id (*)`);

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
