import Link from 'next/link';

export default function BottomNav({ active = 'feed' }: { active?: string }) {
    const navItems = [
        { id: 'feed', icon: 'home', label: 'Feed', path: '/' },
        { id: 'discover', icon: 'search', label: 'Discover', path: '/discover' },
        { id: 'upload', icon: 'add', label: 'Upload', path: '/create', isSpecial: true },
        { id: 'network', icon: 'group', label: 'Network', path: '/chat' },
        { id: 'profile', icon: 'person', label: 'Profile', path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50 lg:hidden rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-end">
                {navItems.map((item) => {
                    const isActive = active === item.id;

                    if (item.isSpecial) {
                        return (
                            <Link key={item.id} href={item.path} className="flex flex-col items-center justify-end gap-1 flex-1 group -mt-6">
                                <div className="bg-primary h-12 w-12 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-[#192434] transform group-hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-white text-[28px]">{item.icon}</span>
                                </div>
                                <p className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-[#91a9ca] group-hover:text-white'}`}>{item.label}</p>
                            </Link>
                        )
                    }

                    return (
                        <Link key={item.id} href={item.path} className="flex flex-col items-center justify-end gap-1 flex-1 group">
                            <div className="relative p-1">
                                <span className={`material-symbols-outlined text-[26px] transition-colors ${isActive ? 'text-white' : 'text-[#91a9ca] group-hover:text-white'}`}>{item.icon}</span>
                                {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>}
                            </div>
                            <p className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-[#91a9ca] group-hover:text-white'}`}>{item.label}</p>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}
