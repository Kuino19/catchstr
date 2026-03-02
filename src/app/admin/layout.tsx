'use client';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { label: 'Overview', icon: 'grid_view', href: '/admin/dashboard' },
        { label: 'Users', icon: 'groups', href: '/admin/users' },
        { label: 'Approvals', icon: 'verified_user', href: '/admin/approvals' },
        { label: 'Moderation', icon: 'shield_person', href: '/admin/reports' },
        { label: 'Advertising', icon: 'ads_click', href: '/admin/ads' },
        { label: 'Audit Logs', icon: 'history', href: '/admin/audit' },
        { label: 'Live Studio', icon: 'podcasts', href: '/admin/live' },
        { label: 'Settings', icon: 'settings', href: '/admin/settings' },
    ];

    return (
        <AdminGuard>
            <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
                {/* Pro Admin Sidebar */}
                <aside className="w-64 bg-[#1e293b] border-r border-slate-800 flex flex-col hidden lg:flex sticky top-0 h-screen">
                    <div className="p-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-slate-900 font-black">shield</span>
                            </div>
                            <div>
                                <h1 className="font-black text-white tracking-tight uppercase leading-none text-lg">Admin</h1>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Control Center</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 space-y-2 mt-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${isActive
                                        ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined font-bold ${isActive ? 'filled' : ''}`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-black uppercase tracking-tight text-xs">{item.label}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6 border-t border-slate-800">
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">exit_to_app</span>
                            <span className="font-bold text-xs">Back to Site</span>
                        </Link>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-16 bg-[#1e293b]/50 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-50">
                        <div className="flex items-center gap-4">
                            {/* Mobile Toggle would go here */}
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                Platform <span className="text-slate-600">/</span> {navItems.find(n => n.href === pathname)?.label || 'Dashboard'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <button className="h-9 w-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors relative">
                                <span className="material-symbols-outlined text-xl">notifications</span>
                                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-[#1e293b]"></span>
                            </button>
                            <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-white uppercase leading-none">Super Admin</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Management Mode</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}
