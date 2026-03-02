'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Report {
    id: string;
    reason: string;
    created_at: string;
    status: string;
    reporter: { full_name: string };
    post: {
        id: string;
        content: string;
        media_url: string;
        profiles: { full_name: string; avatar_url: string };
    };
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchReports() {
        setLoading(true);
        const { data } = await supabase
            .from('reports')
            .select(`
                *,
                reporter:reporter_id (full_name),
                post:post_id (
                    id,
                    content,
                    media_url,
                    profiles:author_id (full_name, avatar_url)
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (data) setReports(data as any);
        setLoading(false);
    }

    useEffect(() => {
        fetchReports();
    }, []);

    const handleReport = async (reportId: string, action: 'resolved' | 'dismissed', postId?: string) => {
        if (action === 'resolved' && postId) {
            await supabase.from('posts').delete().eq('id', postId);
        }

        const { error } = await supabase
            .from('reports')
            .update({ status: action })
            .eq('id', reportId);

        if (!error) {
            setReports(reports.filter(r => r.id !== reportId));
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight text-red-500">Moderation Desk</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Active flags and community standard enforcement</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 grayscale opacity-50">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-[#1e293b] p-20 rounded-[40px] border border-dashed border-slate-800 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 filled">shield_check</span>
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-tighter">System Sanitized</h3>
                    <p className="text-xs text-slate-600 mt-2 font-bold uppercase tracking-widest">No content reports requiring attention</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-[#1e293b] rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl hover:border-red-500/30 transition-all flex flex-col md:flex-row">
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                            <span className="material-symbols-outlined text-xl font-bold">priority_high</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Report Reason</p>
                                            <p className="text-sm font-black text-white mt-1 uppercase tracking-tight">{report.reason}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ref: {report.id.split('-')[0]}</p>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 mb-6">
                                    <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{report.post?.content || 'Media-only post'}"</p>
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full bg-slate-800 overflow-hidden">
                                            <img src={report.post?.profiles?.avatar_url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Author: {report.post?.profiles?.full_name}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center gap-4">
                                    <button
                                        onClick={() => handleReport(report.id, 'resolved', report.post?.id)}
                                        className="h-14 flex-1 bg-red-500 hover:bg-red-600 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">delete_forever</span>
                                        Destroy Content
                                    </button>
                                    <button
                                        onClick={() => handleReport(report.id, 'dismissed')}
                                        className="h-14 px-8 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">visibility_off</span>
                                        Dismiss
                                    </button>
                                </div>
                            </div>

                            {report.post?.media_url && (
                                <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 relative group overflow-hidden">
                                    {report.post.media_url.endsWith('.mp4') ? (
                                        <video src={report.post.media_url} className="w-full h-full object-cover" controls muted />
                                    ) : (
                                        <img src={report.post.media_url} className="w-full h-full object-cover" alt="Evidence" />
                                    )}
                                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/5">
                                        Evidence
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
