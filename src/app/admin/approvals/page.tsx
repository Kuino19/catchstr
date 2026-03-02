'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PendingAgent {
    id: string;
    full_name: string;
    avatar_url: string;
    location: string;
    bio: string;
    created_at: string;
}

export default function ApprovalsPage() {
    const [agents, setAgents] = useState<PendingAgent[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchPending() {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'Agent')
            .eq('verification_status', 'pending')
            .order('created_at', { ascending: false });
        if (data) setAgents(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('profiles')
            .update({ verification_status: status })
            .eq('id', id);

        if (!error) {
            setAgents(agents.filter(a => a.id !== id));
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Agent Verification</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Manual review queue for professional scout applications</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 grayscale opacity-50">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : agents.length === 0 ? (
                <div className="bg-[#1e293b] p-20 rounded-[40px] border border-dashed border-slate-800 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 filled">verified_user</span>
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-tighter">Queue Clear</h3>
                    <p className="text-xs text-slate-600 mt-2 font-bold uppercase tracking-widest">No pending applications at this time</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {agents.map(agent => (
                        <div key={agent.id} className="bg-[#1e293b] rounded-[32px] border border-slate-800 p-8 shadow-xl hover:border-slate-700 transition-all group flex gap-8">
                            <div className="h-32 w-32 rounded-[32px] bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                {agent.avatar_url ? (
                                    <img src={agent.avatar_url} className="w-full h-full object-cover" alt={agent.full_name} />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-slate-900">
                                        <span className="material-symbols-outlined text-4xl text-slate-700">person</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">{agent.full_name}</h3>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{agent.location || 'Globe'}</p>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                        {new Date(agent.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-400 italic mb-6 line-clamp-3 font-medium leading-relaxed">
                                    "{agent.bio || 'Applicant provided no professional summary.'}"
                                </p>

                                <div className="mt-auto flex gap-3">
                                    <button
                                        onClick={() => handleAction(agent.id, 'approved')}
                                        className="flex-1 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                                        Verify Agent
                                    </button>
                                    <button
                                        onClick={() => handleAction(agent.id, 'rejected')}
                                        className="px-6 bg-slate-900 text-slate-500 hover:text-red-500 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center"
                                        title="Reject"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">cancel</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
