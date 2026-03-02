'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

interface Player {
    id: string;
    full_name: string;
    avatar_url: string;
    position: string;
    location: string;
    bio: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [pinnedTalent, setPinnedTalent] = useState<Player[]>([]);
    const [roster, setRoster] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            // Profile
            const { data: pData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setProfile(pData);

            if (pData?.role !== 'Agent') {
                setLoading(false);
                return;
            }

            // Pinned Talent (Interest Flags)
            const { data: flags } = await supabase
                .from('interest_flags')
                .select(`player:player_id (*)`)
                .eq('agent_id', session.user.id);
            if (flags) setPinnedTalent(flags.map((f: any) => f.player));

            // Roster
            const { data: rosterData } = await supabase
                .from('roster')
                .select(`player:player_id (*)`)
                .eq('agent_id', session.user.id);
            if (rosterData) setRoster(rosterData.map((r: any) => r.player));

            setLoading(false);
        }
        loadDashboard();
    }, [router]);
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 font-display">
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Scout Dashboard</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back, {profile?.full_name || 'Agent'}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-100 dark:ring-slate-700">
                    {profile?.avatar_url ? (
                        <img alt="Agent Profile" className="h-full w-full object-cover" src={profile.avatar_url} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-300">
                            <span className="material-symbols-outlined text-slate-500">person</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex flex-col gap-6 p-5">
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="absolute right-[-10px] top-[-10px] bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full opacity-50"></div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary text-[20px]">push_pin</span>
                                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Pinned</h3>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{pinnedTalent.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="absolute right-[-10px] top-[-10px] bg-pitch-green/50 w-16 h-16 rounded-full opacity-30"></div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-pitch-green text-[20px]">groups</span>
                                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Roster</h3>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{roster.length}</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-card border border-slate-100 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">insights</span>
                            Network Growth
                        </h2>
                    </div>
                    <div className="w-full h-32 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-xs">Chart Mockup</div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">Pinned Talent</h2>
                        <Link href="/discover" className="text-primary text-sm font-bold">Discover More</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : pinnedTalent.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                <p className="text-sm italic">You haven't pinned any talent yet.</p>
                            </div>
                        ) : (
                            pinnedTalent.map(player => (
                                <div key={player.id} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700 flex gap-4 items-start">
                                    <div className="relative flex-shrink-0">
                                        <img alt={player.full_name} className="w-20 h-20 rounded-lg object-cover bg-slate-100" src={player.avatar_url || 'https://via.placeholder.com/150'} />
                                        <div className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white">
                                            {player.position || 'ST'}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-base">{player.full_name}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{player.location || 'Location'}</p>
                                            </div>
                                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px] filled">push_pin</span>
                                                PINNED
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{player.bio || 'Professional athlete looking for growth opportunities.'}</p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => router.push(`/profile/${player.id}`)} className="flex-1 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 py-1.5 rounded transition-colors">View Profile</button>
                                            <button onClick={() => router.push(`/chat/${player.id}`)} className="flex-1 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 py-1.5 rounded transition-colors">Message</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            <BottomNav active="profile" />
        </div>
    );
}
