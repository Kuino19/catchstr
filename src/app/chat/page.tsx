'use client';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    avatar_url: string;
}

export default function ChatPage() {
    const [activeAgents, setActiveAgents] = useState<Profile[]>([]);
    const [connections, setConnections] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Agents' | 'Players'>('All');

    useEffect(() => {
        async function loadNetworkingData() {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch profiles to use as connections. In a real app, this would be a join on a 'friends/connections' or 'messages' table.
                // Here, we just fetch other profiles.
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .neq('id', session.user.id)
                    .limit(20);

                if (data && !error) {
                    const profiles = data as Profile[];

                    // Agents for the top rail
                    setActiveAgents(profiles.filter(p => p.role === 'Agent'));

                    // All other profiles for chat list
                    setConnections(profiles);
                }
            }
            setLoading(false);
        }

        loadNetworkingData();
    }, []);

    const filteredConnections = connections.filter(c => {
        if (filter === 'All') return true;
        if (filter === 'Agents') return c.role === 'Agent';
        if (filter === 'Players') return c.role === 'Player';
        return true;
    });

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-text-main min-h-screen flex flex-col relative overflow-hidden font-display">
            <header className="pt-12 pb-4 px-5 bg-background-light dark:bg-background-dark z-10 sticky top-0">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Messages</h1>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-[24px]">edit_square</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-text-muted text-[20px]">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white dark:bg-surface-dark text-slate-900 dark:text-white placeholder-text-muted focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm" placeholder="Search networking..." type="text" />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 mt-6 overflow-x-auto no-scrollbar pb-1">
                    <button
                        onClick={() => setFilter('All')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'All' ? 'bg-primary text-white shadow-lg shadow-primary/25 border border-primary' : 'bg-white dark:bg-surface-dark text-text-muted hover:text-primary hover:bg-primary/10 dark:hover:bg-surface-dark/80 border border-slate-200 dark:border-slate-700/50'}`}
                    >
                        All Chats
                    </button>
                    <button
                        onClick={() => setFilter('Agents')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'Agents' ? 'bg-primary text-white shadow-lg shadow-primary/25 border border-primary' : 'bg-white dark:bg-surface-dark text-text-muted hover:text-primary hover:bg-primary/10 dark:hover:bg-surface-dark/80 border border-slate-200 dark:border-slate-700/50'}`}
                    >
                        Agents
                    </button>
                    <button
                        onClick={() => setFilter('Players')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'Players' ? 'bg-primary text-white shadow-lg shadow-primary/25 border border-primary' : 'bg-white dark:bg-surface-dark text-text-muted hover:text-primary hover:bg-primary/10 dark:hover:bg-surface-dark/80 border border-slate-200 dark:border-slate-700/50'}`}
                    >
                        Players
                    </button>
                </div>
            </header>

            {/* Chat List */}
            <main className="flex-1 overflow-y-auto no-scrollbar px-2 pb-24">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Pinned / Active Now */}
                        {activeAgents.length > 0 && (
                            <div className="px-3 mb-4">
                                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 pl-1">Online Agents</h3>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
                                    {activeAgents.map((agent) => (
                                        <div key={`active-${agent.id}`} className="flex flex-col items-center gap-1 min-w-[64px]">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-primary to-cyan-400">
                                                    {agent.avatar_url ? (
                                                        <img alt={`Profile of ${agent.full_name}`} className="w-full h-full rounded-full object-cover border-2 border-background-light dark:border-background-dark" src={agent.avatar_url} />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-background-light dark:border-background-dark flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background-light dark:border-background-dark rounded-full"></span>
                                            </div>
                                            <span className="text-[10px] font-medium text-center truncate w-16">{agent.full_name?.split(' ')[0] || 'Agent'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* List Items */}
                        <div className="space-y-1">
                            {filteredConnections.length === 0 ? (
                                <div className="text-center p-8 text-slate-500 text-sm">No connections found in this category.</div>
                            ) : (
                                filteredConnections.map((conn) => (
                                    <Link key={conn.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors relative" href={`/chat/${conn.id}`}>
                                        <div className="relative flex-shrink-0">
                                            {conn.avatar_url ? (
                                                <img alt={conn.full_name} className="w-14 h-14 rounded-full object-cover bg-surface-dark" src={conn.avatar_url} />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1">
                                                    {conn.full_name || 'Anonymous User'}
                                                    {conn.role === 'Agent' && (
                                                        <span className="material-symbols-outlined text-primary text-[16px] filled w-4">verified</span>
                                                    )}
                                                </h4>
                                                <span className="text-xs font-medium text-primary">New</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                                                {conn.role === 'Agent' ? (
                                                    <><span className="material-symbols-outlined text-text-muted text-[16px]">attachment</span> View their profile to connect.</>
                                                ) : (
                                                    `Looking to connect - ${conn.position || 'Player'}`
                                                )}
                                            </p>
                                        </div>
                                        {Math.random() > 0.5 && <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0"></div>}
                                    </Link>
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>

            <button className="absolute bottom-24 right-5 w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white hover:scale-105 transition-transform z-20">
                <span className="material-symbols-outlined text-[28px]">add_comment</span>
            </button>

            <BottomNav active="network" />
        </div>
    );
}
