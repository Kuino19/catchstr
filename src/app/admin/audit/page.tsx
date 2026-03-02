'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { downloadCSV, logAdminAction } from '@/lib/admin';

interface AuditLog {
    id: string;
    action: string;
    target_type: string;
    target_id: string;
    details: any;
    created_at: string;
    profiles: {
        full_name: string;
    } | null;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles:admin_id(full_name)')
            .order('created_at', { ascending: false });

        if (data && !error) {
            setLogs(data as any[]);
        }
        setLoading(false);
    }

    const filteredLogs = logs.filter(log => filter === 'All' || log.target_type === filter.toLowerCase());

    const handleExport = () => {
        const exportData = filteredLogs.map(l => ({
            timestamp: l.created_at,
            admin: l.profiles?.full_name || 'System',
            action: l.action,
            target: l.target_type,
            target_id: l.target_id,
            details: JSON.stringify(l.details)
        }));
        downloadCSV(exportData, 'catchstr_audit_report');
        logAdminAction('Export Audit CSV', 'system');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Operational Logs</h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-widest text-[10px]">Security and accountability audit trail.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLogs}
                        className="h-11 w-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">refresh</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 font-black rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-lg">description</span>
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['All', 'User', 'Setting', 'Post', 'Ad', 'System'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filter === type
                                ? 'bg-primary border-primary text-slate-900 shadow-lg shadow-primary/10'
                                : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Logs Timeline */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="flex flex-col">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="p-6 border-b border-white/5 animate-pulse flex items-center gap-4">
                                <div className="h-10 w-10 bg-white/5 rounded-xl"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-white/5 rounded w-1/4"></div>
                                    <div className="h-2 bg-white/5 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-20 text-center opacity-30 flex flex-col items-center">
                            <span className="material-symbols-outlined text-6xl mb-4">history_toggle_off</span>
                            <p className="font-black uppercase tracking-widest text-xs">No administrative actions recorded</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div key={log.id} className="p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors flex items-start gap-4 group">
                                <div className={`h-11 w-11 rounded-2xl shrink-0 flex items-center justify-center border ${log.action.includes('Suspend') ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                        log.action.includes('Approved') || log.action.includes('Setting') ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                            'bg-primary/10 border-primary/20 text-primary'
                                    }`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {log.action.includes('User') ? 'person' :
                                            log.action.includes('Setting') ? 'settings' :
                                                log.action.includes('CSV') || log.action.includes('Report') ? 'analytics' : 'bolt'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                                        <h3 className="font-black text-white text-sm uppercase tracking-tight">
                                            {log.action}
                                        </h3>
                                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-xs">
                                        <span className="text-primary font-black uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                            {log.profiles?.full_name || 'SYSTEM'}
                                        </span>
                                        <span className="text-slate-500 text-[10px] font-bold">ACTED ON</span>
                                        <span className="text-slate-300 font-bold uppercase">{log.target_type || 'GENERAL'}</span>
                                        {log.target_id && (
                                            <span className="text-slate-600 font-mono text-[9px] truncate max-w-[100px] hover:text-slate-400 cursor-help" title={log.target_id}>
                                                {log.target_id}
                                            </span>
                                        )}
                                    </div>
                                    {log.details && (
                                        <div className="mt-4 p-4 bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden hidden group-hover:block animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[14px] text-slate-500">info</span>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payload Details</p>
                                            </div>
                                            <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto no-scrollbar">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="text-center">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    End of audit stream • Immutable record
                </p>
            </div>
        </div>
    );
}
