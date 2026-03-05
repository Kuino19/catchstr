'use client';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';
import PostCard from '@/components/PostCard';
import PastBroadcastCard from '@/components/live/PastBroadcastCard';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    location: string;
    avatar_url: string;
    bio: string;
    banner_url: string;
    market_value: number;
}

interface MarketValuePoint {
    value: number;
    created_at: string;
}

interface Endorsement {
    id: string;
    skill: string;
    endorser: {
        full_name: string;
        avatar_url: string;
    };
}

interface Post {
    id: string;
    content: string;
    media_url: string;
    likes_count: number;
    created_at: string;
    profiles: Profile;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [valueHistory, setValueHistory] = useState<MarketValuePoint[]>([]);
    const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
    const [pastBroadcasts, setPastBroadcasts] = useState<any[]>([]);

    useEffect(() => {
        async function loadProfile() {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, position, location, avatar_url, bio, banner_url, market_value')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData as Profile);
                }

                // Fetch Posts
                const { data: postsData } = await supabase
                    .from('posts')
                    .select('id, content, media_url, likes_count, created_at, profiles:author_id (id, full_name, role, position, location, avatar_url)')
                    .eq('author_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (postsData) {
                    setPosts(postsData as unknown as Post[]);
                }

                // Fetch Follower Count
                const { count: followers } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', session.user.id);
                setFollowerCount(followers || 0);

                // Fetch Following Count
                const { count: following } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('follower_id', session.user.id);
                setFollowingCount(following || 0);

                // Fetch Market Value History
                const { data: historyData } = await supabase
                    .from('market_value_history')
                    .select('value, created_at')
                    .eq('player_id', session.user.id)
                    .order('created_at', { ascending: true });
                if (historyData) setValueHistory(historyData);

                // Fetch Endorsements
                const { data: endorsementData } = await supabase
                    .from('endorsements')
                    .select(`
                        id,
                        skill,
                        endorser:endorser_id (full_name, avatar_url)
                    `)
                    .eq('player_id', session.user.id);
                if (endorsementData) setEndorsements(endorsementData as any);

                // Fetch Past Broadcasts
                const { data: vods } = await supabase
                    .from('past_broadcasts')
                    .select('id, user_id, asset_id, playback_id, duration, created_at')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });
                if (vods) setPastBroadcasts(vods);
            }
            setLoading(false);
        }

        loadProfile();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // The ProtectedRoute listener will automatically redirect to login
    };

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p>Could not load profile data.</p>
                <Link href="/" className="mt-4 text-primary font-bold">Go Back</Link>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased pb-24 min-h-screen">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <Link href="/" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </Link>
                <h1 className="text-lg font-bold tracking-tight">Profile</h1>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button onClick={handleSignOut} className="text-red-500 hover:text-red-700 transition-colors flex items-center" title="Sign Out">
                        <span className="material-symbols-outlined text-[24px]">logout</span>
                    </button>
                </div>
            </header>

            <section className="bg-white dark:bg-slate-900 px-6 pt-6 pb-8 rounded-b-3xl shadow-sm border-b border-slate-100 dark:border-slate-800">
                {profile.banner_url && (
                    <div className="absolute top-0 left-0 w-full h-[180px] z-0 overflow-hidden">
                        <img src={profile.banner_url} className="w-full h-full object-cover" alt="Banner" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent"></div>
                    </div>
                )}

                <div className="flex flex-col items-center text-center relative z-10 pt-8">
                    <div className="relative mb-4">
                        <div className={`h-28 w-28 rounded-full p-1 shadow-inner ${profile.banner_url ? 'bg-white dark:bg-slate-900' : 'bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600'}`}>
                            {profile.avatar_url ? (
                                <img alt="Profile Picture" className="h-full w-full rounded-full object-cover border-4 border-white dark:border-slate-800" src={profile.avatar_url} />
                            ) : (
                                <div className="h-full w-full rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-800 flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-slate-400 text-5xl">person</span>
                                </div>
                            )}
                        </div>
                        {profile.role === 'Agent' && (
                            <div className="absolute bottom-1 right-1 bg-primary text-slate-900 p-1.5 rounded-full border-[3px] border-white dark:border-slate-800 shadow-sm flex items-center justify-center" title="Verified Agent">
                                <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold">{profile.full_name || 'Anonymous User'}</h2>

                    <div className="flex items-center gap-1.5 mt-1 text-pitch-green font-medium text-sm">
                        <span className="material-symbols-outlined text-[16px] filled">
                            {profile.role === 'Agent' ? 'verified_user' : 'sports_soccer'}
                        </span>
                        <span>{profile.position ? profile.position : (profile.role === 'Agent' ? 'Licensed Agent' : 'Player')}</span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                        {profile.location || 'Location Not Set'}
                    </p>

                    <div className="flex items-center justify-center gap-8 w-full mt-6 py-4 border-y border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold">{followerCount}</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Followers</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold">{followingCount}</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Following</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold">{posts.length}</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Highlights</span>
                        </div>
                    </div>

                    <div className="mt-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                        {profile.bio || 'Edit your profile to add a bio and let the networking begin!'}
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                        <Link href="/profile/edit" className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 py-3 px-4 rounded-xl font-semibold text-sm shadow-lg shadow-slate-200 dark:shadow-none transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Edit Profile
                        </Link>
                        <button className="bg-primary/10 hover:bg-primary/20 text-primary py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-primary/20">
                            <span className="material-symbols-outlined text-[18px]">share</span>
                            Share Profile
                        </button>
                    </div>

                    <div className="w-full mt-3">
                        <Link href="/saved" className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-between border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px] text-primary">bookmark</span>
                                Saved Posts
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                        </Link>
                    </div>

                    {/* Market Value & Endorsements (Scout Overview) */}
                    {profile.role === 'Player' && (
                        <div className="w-full mt-6 space-y-4">
                            <div className="bg-slate-900 dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-symbols-outlined text-6xl text-primary">trending_up</span>
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Est. Market Value</h4>
                                    <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">trending_up</span>
                                        +12%
                                    </span>
                                </div>
                                <p className="text-white text-3xl font-black">€{(profile.market_value || 0).toLocaleString()}</p>
                                <p className="text-white/40 text-[11px] mt-1 font-medium italic">Powered by catchstr analytics</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-pitch-green filled">verified</span>
                                    Skill Endorsements
                                </h4>

                                {endorsements.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No professional endorsements yet. Share highlights to get scouted!</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {endorsements.map((en) => (
                                            <div key={en.id} className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-2 group cursor-default">
                                                <span className="text-xs font-bold">{en.skill}</span>
                                                <div className="h-4 w-4 rounded-full overflow-hidden bg-slate-200">
                                                    {en.endorser.avatar_url ? (
                                                        <img src={en.endorser.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-[10px] text-slate-400 flex items-center justify-center h-full">person</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <main className="px-4 py-6 flex flex-col gap-6">
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xl font-bold">My Highlights</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{posts.length} Posts</span>
                    </div>

                    <div className="flex flex-col gap-8">
                        {posts.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center opacity-60">
                                <span className="material-symbols-outlined text-4xl mb-2">movie_filter</span>
                                <p className="text-sm">No highlights posted yet.</p>
                                <Link href="/create" className="text-primary font-bold text-sm mt-2 block">Create your first post</Link>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={profile?.id || null}
                                    onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* Past Broadcasts (VODs) Section */}
                {pastBroadcasts.length > 0 && (
                    <section className="mt-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">play_circle</span>
                                Past Broadcasts
                            </h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{pastBroadcasts.length} VODs</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {pastBroadcasts.map((vod) => (
                                <PastBroadcastCard key={vod.id} broadcast={vod} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
