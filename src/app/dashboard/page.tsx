import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 font-display">
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Scout Dashboard</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back, Agent Smith</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-100 dark:ring-slate-700">
                    <img alt="Agent Profile" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAflUV3QkxE_RcGYJsDzBU5Vy-AHBXCM5g8h5G6hNYVxCqoYOgvgU-WTclr8xcKXyfPN3YuVDnw6IKA5dYHQQ7KsbycqKfJu8I89FP5yGFlduvjoTlu8_fIv92JTlPM3uU5wJM3AG0KiqPeDhhX1Kg_XwVfTxoWt3QGhTRFfE5-GuVsyX7ddZDXwnX2b6elis9dpX-P7yQ4aAEdr66cnjLUHYoG-uyjh0JJib0ILJyzxZABlW61mC37gNQwokerwjzoUCNY1Wkxd9eR" />
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
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">12</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-purple-600 text-[20px]">inventory_2</span>
                                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Applications</h3>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">48</p>
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
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">New Talent Alerts</h2>
                        <Link href="/discover" className="text-primary text-sm font-bold">See All</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700 flex gap-4 items-start">
                            <div className="relative flex-shrink-0">
                                <img alt="Player Profile" className="w-20 h-20 rounded-lg object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArg34bM-NKhOFvhI_0_dPuDrI3nc-8cj5SbFP91P6Viugkm5Y3zhbB60BbO_DNJfY483GblqxYYdWnjSoiMGbDprshM15mDbNfu90yhTfTuQwlRSB-GFWYk_7Je_ICoWu_bkgEuV4F5n9OWU0QED5T7J5_9UtgDtVW7o_PKsyeVrmEhQloipX-EwvzSckvnPWtiEPyXapLP4xducdVkqv-9l_ne3cUBII6YUZb7htaB2hjgg4IyjMQJn6LNxqGmFTYHKKcsVgza7pw" />
                                <div className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white">ST</div>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Marcus Silva</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">19 Yrs • Manchester</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-pitch-green text-[10px] font-bold px-2 py-1 rounded">94% MATCH</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">Explosive winger looking for pro opportunities. Academy graduate with a hunger to win.</p>
                                <div className="flex gap-2 mt-3">
                                    <button className="flex-1 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 py-1.5 rounded transition-colors">View Profile</button>
                                    <button className="flex-1 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 py-1.5 rounded transition-colors">Message</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700 flex gap-4 items-start">
                            <div className="relative flex-shrink-0">
                                <img alt="Player Profile 2" className="w-20 h-20 rounded-lg object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfx_ofC7o13srAS55AMi4CwHA3g5dB35Ly-w6Ai79m-NQiXx7-nMQccCWSaDpidDYCDoueLfDcofXDKfZSGCm_lbyDDox8pX6mfabgxUR5nkiEPnDgg-9B4OUHvzdZalFiTTqCKccC3d9tmut21XtP1eG4DrhEndzI7mrJXh232O2t9zZNq438kp_vedydFCgo0tXbm1GqsYRlFvTJ4s7EXseF-nIk9qOb5au0l_OfrSTpnmrXRpA_ibYCHzN9xmymU0DxGWzKtZlr" />
                                <div className="absolute top-1 right-1 bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white">LW</div>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">K. Yamal</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">17 Yrs • Barcelona B</p>
                                    </div>
                                    <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold px-2 py-1 rounded">SCOUTED</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">Highly technical winger with incredible vision and dribbling skills. One to watch.</p>
                                <div className="flex gap-2 mt-3">
                                    <button className="flex-1 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 py-1.5 rounded transition-colors">View Profile</button>
                                    <button className="flex-1 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 py-1.5 rounded transition-colors">Message</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav active="profile" />
        </div>
    );
}
