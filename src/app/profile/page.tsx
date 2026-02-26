'use client';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    location: string;
    avatar_url: string;
    bio: string;
    banner_url: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (data && !error) {
                    setProfile(data as Profile);
                }
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
                            <span className="text-lg font-bold">124</span>
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
