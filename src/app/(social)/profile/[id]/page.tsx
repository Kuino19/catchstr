'use client';
import { useEffect, useState, use } from 'react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    location: string;
    avatar_url: string;
    banner_url: string;
    bio: string;
    market_value: number;
}

interface Endorsement {
    id: string;
    skill: string;
    endorser: {
        id: string;
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

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: profileId } = use(params);
    const router = useRouter();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
    const [followersCount, setFollowersCount] = useState(0);
    const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
    const [myProfile, setMyProfile] = useState<{ id: string; role: string; full_name: string; avatar_url: string } | null>(null);
    const [isFlagged, setIsFlagged] = useState(false);
    const [endorsing, setEndorsing] = useState(false);

    useEffect(() => {
        async function loadProfileData() {
            const { data: { session } } = await supabase.auth.getSession();

            let myId = null;
            if (session?.user) {
                myId = session.user.id;
                setCurrentUserId(myId);

                if (myId === profileId) {
                    router.replace('/profile');
                    return;
                }
            }

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);
            }

            // Fetch posts
            const { data: postsData } = await supabase
                .from('posts')
                .select(`*, profiles:author_id (*)`)
                .eq('author_id', profileId)
                .order('created_at', { ascending: false });

            if (postsData) {
                setPosts(postsData as unknown as Post[]);
            }

            // Fetch followers count (only accepted)
            const { count: followers } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', profileId)
                .eq('status', 'accepted');

            setFollowersCount(followers || 0);

            // Fetch endorsements
            const { data: endorsementData } = await supabase
                .from('endorsements')
                .select(`
                    id,
                    skill,
                    endorser:endorser_id (id, full_name, avatar_url)
                `)
                .eq('player_id', profileId);
            if (endorsementData) setEndorsements(endorsementData as any);

            // Fetch follow status
            if (myId) {
                // My Profile (Self)
                const { data: mData } = await supabase
                    .from('profiles')
                    .select('id, role, full_name, avatar_url')
                    .eq('id', myId)
                    .single();
                if (mData) setMyProfile(mData as any);

                // Check Interest Flag
                const { data: flagData } = await supabase
                    .from('interest_flags')
                    .select('*')
                    .eq('agent_id', myId)
                    .eq('player_id', profileId)
                    .single();
                setIsFlagged(!!flagData);

                const { data: followData } = await supabase
                    .from('follows')
                    .select('status')
                    .eq('follower_id', myId)
                    .eq('following_id', profileId)
                    .single();

                if (followData) {
                    setFollowStatus(followData.status);
                }
            }

            setLoading(false);
        }

        loadProfileData();
    }, [profileId, router]);

    const handleFollowToggle = async () => {
        if (!currentUserId) {
            router.push('/login');
            return;
        }

        if (followStatus === 'accepted' || followStatus === 'pending') {
            // Unfollow / Cancel Request
            const prevStatus = followStatus;
            setFollowStatus('none');
            if (prevStatus === 'accepted') setFollowersCount(prev => prev - 1);

            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUserId)
                .eq('following_id', profileId);
        } else {
            // Connect Request
            setFollowStatus('pending');

            const { error } = await supabase
                .from('follows')
                .insert([
                    {
                        follower_id: currentUserId,
                        following_id: profileId,
                        status: 'pending'
                    }
                ]);

            if (!error) {
                await supabase.from('notifications').insert([{
                    user_id: profileId,
                    actor_id: currentUserId,
                    type: 'follow'
                }]);
            }
        }
    };

    const handleFlagInterest = async () => {
        if (!currentUserId || !myProfile) return;
        if (myProfile.role !== 'Agent') return;

        if (isFlagged) {
            setIsFlagged(false);
            await supabase.from('interest_flags').delete().eq('agent_id', currentUserId).eq('player_id', profileId);
        } else {
            setIsFlagged(true);
            await supabase.from('interest_flags').insert([{ agent_id: currentUserId, player_id: profileId }]);
            await supabase.from('notifications').insert([{ user_id: profileId, actor_id: currentUserId, type: 'follow' }]); // Use follow as a generic "scouted" alert for now
        }
    };

    const handleEndorse = async () => {
        if (!currentUserId || !myProfile || profile?.role !== 'Player') return;
        if (myProfile.role !== 'Agent') {
            alert("Only verified agents can endorse players.");
            return;
        }

        const skill = prompt("Which skill are you endorsing?");
        if (!skill) return;

        setEndorsing(true);
        const { data, error } = await supabase.from('endorsements').insert([
            { player_id: profileId, endorser_id: currentUserId, skill: skill.trim() }
        ]).select(`
            id,
            skill,
            endorser:endorser_id (id, full_name, avatar_url)
        `).single();

        if (data) {
            setEndorsements(prev => [...prev, data as any]);
        }
        setEndorsing(false);
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
                <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                <p>User not found.</p>
                <button onClick={() => router.back()} className="mt-4 text-primary font-bold">Go Back</button>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased pb-24 min-h-screen">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">{profile.full_name?.split(' ')[0] || 'User'}'s Profile</h1>
                <button className="text-slate-500 hover:text-primary transition-colors flex items-center">
                    <span className="material-symbols-outlined text-[24px]">more_vert</span>
                </button>
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
                        <div className={`h-28 w-28 rounded-full p-1 shadow-inner ${profile.banner_url ? 'bg-white dark:bg-slate-900' : 'bg-gradient-to-tr from-primary to-pitch-green'}`}>
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

                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                        <button
                            onClick={handleFollowToggle}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${followStatus !== 'none'
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
                                : 'bg-primary text-white hover:bg-blue-600 shadow-primary/30'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {followStatus === 'accepted' ? 'group_remove' : followStatus === 'pending' ? 'hourglass_top' : 'person_add'}
                            </span>
                            {followStatus === 'accepted' ? 'Connected' : followStatus === 'pending' ? 'Requested' : 'Connect'}
                        </button>

                        {myProfile?.role === 'Agent' ? (
                            <button
                                onClick={handleFlagInterest}
                                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border ${isFlagged
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isFlagged ? 'filled' : ''}`}>
                                    {isFlagged ? 'push_pin' : 'bookmarks'}
                                </span>
                                {isFlagged ? 'Pinned' : 'Pin Talent'}
                            </button>
                        ) : (
                            <Link href={`/chat/${profileId}`} className="bg-pitch-green/10 hover:bg-pitch-green/20 text-pitch-green dark:text-[#34d399] py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-pitch-green/20">
                                <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                                Message
                            </Link>
                        )}
                    </div>

                    {/* Market Value & Endorsements (Scout Overview) */}
                    {profile.role === 'Player' && (
                        <div className="w-full mt-6 space-y-4">
                            <div className="bg-slate-900 dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative text-left">
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

                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-pitch-green filled">verified</span>
                                        Skill Endorsements
                                    </h4>
                                    {myProfile?.role === 'Agent' && (
                                        <button
                                            onClick={handleEndorse}
                                            disabled={endorsing}
                                            className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                            {endorsing ? 'Adding...' : 'Endorse Skill'}
                                        </button>
                                    )}
                                </div>

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
                        <h3 className="text-xl font-bold">Highlights</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{posts.length} Posts</span>
                    </div>

                    <div className="flex flex-col gap-8">
                        {posts.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center opacity-60">
                                <span className="material-symbols-outlined text-4xl mb-2">movie_filter</span>
                                <p className="text-sm">No highlights available yet.</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={currentUserId}
                                />
                            ))
                        )}
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
