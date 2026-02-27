'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const navItems = [
    { name: 'Home', href: '/', icon: 'home' },
    { name: 'Discover', href: '/discover', icon: 'explore' },
    { name: 'Messages', href: '/chat', icon: 'chat_bubble' },
    { name: 'Notifications', href: '/notifications', icon: 'notifications' },
    { name: 'Saved', href: '/saved', icon: 'bookmark' },
    { name: 'Profile', href: '/profile', icon: 'person' },
];

export default function LeftSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 px-6 py-8 bg-background-light dark:bg-background-dark overflow-y-auto">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-10 group px-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-white text-2xl font-bold">sports_soccer</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">catchstr</h1>
            </Link>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[26px] ${isActive ? 'filled' : ''}`}>
                                {item.icon}
                            </span>
                            <span className="font-semibold text-[17px]">{item.name}</span>
                        </Link>
                    );
                })}

                <Link
                    href="/create"
                    className="mt-6 flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/30 hover:bg-blue-600 hover:scale-[1.02] transition-all"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Share Highlight
                </Link>
            </nav>

            {/* Footer / Theme Toggle */}
            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Network Live</span>
                </div>
                <ThemeToggle />
            </div>
        </aside>
    );
}
