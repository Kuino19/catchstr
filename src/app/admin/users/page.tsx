'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { downloadCSV } from '@/lib/admin';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_suspended: boolean;
    created_at: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        // ✅ Only select the columns we actually render, not select('*')
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, is_suspended, created_at')
            .order('created_at', { ascending: false });

        if (data && !error) {
            setUsers(data as Profile[]);
        }
        setLoading(false);
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.id.includes(search);
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'All' ||
            (statusFilter === 'Suspended' ? user.is_suspended : !user.is_suspended);

        return matchesSearch && matchesRole && matchesStatus;
    });

    async function toggleSuspension(userId: string, currentStatus: boolean) {
        const newStatus = !currentStatus;

        // ✅ Use server-side API route which verifies admin role before mutating
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/admin/users/suspend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ userId, isSuspended: newStatus }),
        });

        if (res.ok) {
            setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: newStatus } : u));
        } else {
            const err = await res.json();
            console.error('Failed to update suspension status:', err);
        }
    }

    const handleExport = () => {
        downloadCSV(filteredUsers, 'catchstr_users_export');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">USER ARCHIVE</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage platform population and account security.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all text-sm uppercase tracking-widest"
                >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Export Archive
                </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="md:col-span-2 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                    <input
                        type="text"
                        placeholder="Search by name or UUID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                >
                    <option value="All" className="bg-[#0f172a]">All Roles</option>
                    <option value="Player" className="bg-[#0f172a]">Players</option>
                    <option value="Agent" className="bg-[#0f172a]">Agents</option>
                    <option value="Scout" className="bg-[#0f172a]">Scouts</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                >
                    <option value="All" className="bg-[#0f172a]">All Status</option>
                    <option value="Active" className="bg-[#0f172a]">Active Only</option>
                    <option value="Suspended" className="bg-[#0f172a]">Suspended</option>
                </select>
            </div>

            {/* User Table */}
            <div className="bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Access Role</th>
                                <th className="px-6 py-4 text-[10px) font-black uppercase tracking-widest text-slate-400">Joined</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Security Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No personnel found matching criteria</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white truncate">{user.full_name || 'Anonymous'}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono truncate">{user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${user.role === 'Agent' ? 'bg-primary/20 text-primary border border-primary/20' :
                                                user.role === 'Scout' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                                                    'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${user.is_suspended
                                                ? 'bg-red-500/10 text-red-500'
                                                : 'bg-green-500/10 text-green-500'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.is_suspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                {user.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => toggleSuspension(user.id, user.is_suspended)}
                                                    title={user.is_suspended ? 'Unsuspend' : 'Suspend'}
                                                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${user.is_suspended
                                                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                                                        : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {user.is_suspended ? 'how_to_reg' : 'block'}
                                                    </span>
                                                </button>
                                                <button className="h-9 w-9 bg-white/5 text-slate-400 rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
