'use client';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Ad {
    id: string;
    title: string;
    image_url: string;
    link_url: string;
}

interface AdBannerProps {
    // ✅ Ad is now passed as a prop from the parent — no per-render DB fetch
    ad: Ad;
}

export default function AdBanner({ ad }: AdBannerProps) {
    const handleClick = async () => {
        // Track the click server-side (fire-and-forget)
        supabase.rpc('increment_ad_clicks', { ad_id: ad.id }).then(() => { });
        window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    };

    // Track impression once on mount
    const handleImpression = () => {
        supabase.rpc('increment_ad_impressions', { ad_id: ad.id }).then(() => { });
    };

    return (
        <div
            onClick={handleClick}
            ref={(el) => { if (el) handleImpression(); }}
            className="w-full bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative"
        >
            <div className="absolute top-3 right-4 z-10">
                <span className="bg-slate-900/60 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">Sponsored</span>
            </div>
            <div className="h-48 w-full overflow-hidden relative">
                <Image
                    src={ad.image_url}
                    alt={ad.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 672px"
                />
            </div>
            <div className="p-5 flex items-center justify-between">
                <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Promotion</h4>
                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{ad.title}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-amber-500/20">
                    <span className="material-symbols-outlined font-black text-xl">open_in_new</span>
                </div>
            </div>
        </div>
    );
}
