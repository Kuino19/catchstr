'use client';
import { useEffect, useState, use } from 'react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    location: string;
    avatar_url: string;
    banner_url: string;
    bio: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: profileId } = use(params);
    const router = useRouter();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    useEffect(() => {
        async function loadProfileData() {
            const { data: { session } } = await supabase.auth.getSession();

            let myId = null;
            if (session?.user) {
                myId = session.user.id;
                setCurrentUserId(myId);

                // If it's my own profile, redirect to /profile
                if (myId === profileId) {
                    router.replace('/profile');
                    return;
                }
            }

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (profileData && !profileError) {
                setProfile(profileData as Profile);
            }

            // Fetch followers count
            const { count: followers } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', profileId);

            setFollowersCount(followers || 0);

            // Fetch if current user is following this profile
            if (myId) {
                const { data: followData } = await supabase
                    .from('follows')
                    .select('*')
                    .eq('follower_id', myId)
                    .eq('following_id', profileId)
                    .single();

                if (followData) {
                    setIsFollowing(true);
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

        if (isFollowing) {
            // Unfollow
            setIsFollowing(false);
            setFollowersCount(prev => prev - 1);

            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUserId)
                .eq('following_id', profileId);
        } else {
            // Follow
            setIsFollowing(true);
            setFollowersCount(prev => prev + 1);

            const { error } = await supabase
                .from('follows')
                .insert([
                    {
                        follower_id: currentUserId,
                        following_id: profileId,
                    }
                ]);

            if (!error) {
                // Insert Notification
                await supabase.from('notifications').insert([{
                    user_id: profileId,
                    actor_id: currentUserId,
                    type: 'follow'
                }]);
            }
        }
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

                    <div className="flex items-center justify-center gap-8 w-full mt-6 py-4 border-y border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold">{followersCount}</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Connections</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold">45</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{profile.role === 'Agent' ? 'Roster' : 'Highlights'}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold">12</span>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{profile.role === 'Agent' ? 'Deals' : 'Clubs'}</span>
                        </div>
                    </div>

                    <div className="mt-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                        {profile.bio || 'This user has not set a bio yet.'}
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                        <button
                            onClick={handleFollowToggle}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${isFollowing
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
                                : 'bg-primary text-white hover:bg-blue-600 shadow-primary/30'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {isFollowing ? 'group_remove' : 'person_add'}
                            </span>
                            {isFollowing ? 'Connected' : 'Connect'}
                        </button>
                        <Link href={`/chat/${profileId}`} className="bg-pitch-green/10 hover:bg-pitch-green/20 text-pitch-green dark:text-[#34d399] py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-pitch-green/20">
                            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                            Message
                        </Link>
                    </div>
                </div>
            </section>

            <main className="px-4 py-6 flex flex-col gap-6">
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">Activity</h3>
                        <button className="text-pitch-green text-xs font-semibold hover:text-primary transition-colors">View All</button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 text-center opacity-70">
                        <div className="text-sm">Activity feed coming soon...</div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
