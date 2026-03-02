'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        pendingApprovals: 0,
        pendingReports: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
            const { count: approvalCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Agent').eq('verification_status', 'pending');
            const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            setStats({
                totalUsers: userCount || 0,
                totalPosts: postCount || 0,
                pendingApprovals: approvalCount || 0,
                pendingReports: reportCount || 0
            });
            setLoading(false);
        }
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Executive Overview</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Real-time platform performance and vital signs</p>
            </div>

            {/* Stat Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Users', value: stats.totalUsers, icon: 'group', color: 'text-blue-500', trend: '+12%' },
                    { label: 'Platform Activity', value: stats.totalPosts, icon: 'bolt', color: 'text-pitch-green', trend: '+5%' },
                    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: 'fact_check', color: 'text-amber-500', trend: stats.pendingApprovals > 0 ? 'Action Reqd' : 'Clear' },
                    { label: 'Active Reports', value: stats.pendingReports, icon: 'warning', color: 'text-red-500', trend: stats.pendingReports > 0 ? 'Urgent' : 'Secure' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#1e293b] p-6 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div className="relative z-10">
                            <div className={`h-12 w-12 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-4 ${stat.color}`}>
                                <span className="material-symbols-outlined font-bold text-2xl">{stat.icon}</span>
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</h3>
                            <div className="flex items-end gap-3">
                                <p className="text-3xl font-black text-white">{loading ? '...' : stat.value.toLocaleString()}</p>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900/50 ${stat.trend.includes('+') ? 'text-pitch-green' : 'text-slate-400'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Grid Layout for deeper insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart Area */}
                <div className="lg:col-span-2 bg-[#1e293b] rounded-[40px] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-white">Talent Acquisition</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">User registration velocity (Last 30 Days)</p>
                            </div>
                            <select className="bg-slate-900 border-none rounded-xl text-[10px] font-black uppercase text-slate-400 py-2 px-4 focus:ring-1 focus:ring-primary outline-none">
                                <option>Monthly</option>
                                <option>Weekly</option>
                            </select>
                        </div>

                        <div className="flex-1 flex items-end gap-2 px-2 min-h-[200px]">
                            {[40, 70, 45, 90, 65, 80, 55, 100, 85, 95, 75, 110].map((h, i) => (
                                <div key={i} className="flex-1 bg-primary/20 hover:bg-primary rounded-t-lg transition-all duration-500 group relative cursor-pointer" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                        {Math.floor(h * 1.5)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Jan</span>
                            <span>Jun</span>
                            <span>Dec</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Recent Events */}
                <div className="bg-[#1e293b] rounded-[40px] border border-slate-800 p-8 shadow-2xl">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Operations Feed</h3>
                    <div className="space-y-6">
                        {[
                            { event: 'New Agent Signed', time: '2m ago', icon: 'person_add', color: 'text-blue-500' },
                            { event: 'Highlight Flagged', time: '14m ago', icon: 'report', color: 'text-red-500' },
                            { event: 'Ad Campaign Live', time: '1h ago', icon: 'rocket_launch', color: 'text-amber-500' },
                            { event: 'Database Backup', time: '4h ago', icon: 'cloud_done', color: 'text-pitch-green' },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className={`h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center ${log.color} group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined text-lg">{log.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-black uppercase text-slate-200">{log.event}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{log.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all">
                        View Audit Log
                    </button>
                </div>
            </div>
        </div>
    );
}
