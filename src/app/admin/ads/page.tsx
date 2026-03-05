'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/ConfirmDialog';

interface Ad {
    id: string;
    title: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
    impressions_count: number;
    clicks_count: number;
    created_at: string;
}

export default function AdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newAd, setNewAd] = useState({ title: '', image_url: '', link_url: '' });
    const { confirm: confirmDialog, DialogComponent } = useConfirm();

    async function fetchAds() {
        setLoading(true);
        const { data } = await supabase
            .from('ads')
            .select('id, title, image_url, link_url, is_active, impressions_count, clicks_count, created_at')
            .order('created_at', { ascending: false });
        if (data) setAds(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchAds();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('ads').insert([newAd]);
        if (!error) {
            fetchAds();
            setShowCreate(false);
            setNewAd({ title: '', image_url: '', link_url: '' });
        }
    };

    const toggleAd = async (id: string, current: boolean) => {
        const { error } = await supabase.from('ads').update({ is_active: !current }).eq('id', id);
        if (!error) {
            setAds(ads.map(ad => ad.id === id ? { ...ad, is_active: !current } : ad));
        }
    };

    const deleteAd = async (id: string) => {
        const ok = await confirmDialog({
            title: 'Delete ad campaign?',
            message: 'This ad will be permanently removed and all its data will be lost.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        const { error } = await supabase.from('ads').delete().eq('id', id);
        if (!error) {
            setAds(ads.filter(ad => ad.id !== id));
            toast.success('Ad deleted.');
        } else {
            toast.error('Failed to delete ad.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight text-amber-500">Marketing Hub</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Campaign management and performance analytics</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined font-black">{showCreate ? 'close' : 'add_circle'}</span>
                    {showCreate ? 'Cancel' : 'New Campaign'}
                </button>
            </div>

            {showCreate && (
                <div className="bg-[#1e293b] p-8 rounded-[40px] border border-amber-500/30 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8">Launch New Ad Campaign</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white/40">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Internal Campaign Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newAd.title}
                                    onChange={e => setNewAd({ ...newAd, title: e.target.value })}
                                    placeholder="e.g. Winter 2024 Showcase"
                                    className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-white placeholder:text-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Target Action URL</label>
                                <input
                                    type="url"
                                    required
                                    value={newAd.link_url}
                                    onChange={e => setNewAd({ ...newAd, link_url: e.target.value })}
                                    placeholder="https://catchstr.com/shop"
                                    className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-white placeholder:text-slate-600"
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Creative High-Res Image URL</label>
                                <input
                                    type="url"
                                    required
                                    value={newAd.image_url}
                                    onChange={e => setNewAd({ ...newAd, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-white placeholder:text-slate-600"
                                />
                            </div>
                            <button type="submit" className="w-full h-[68px] bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:brightness-110 transition-all mt-auto shadow-xl shadow-amber-500/10">
                                Deploy Campaign
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading && ads.length === 0 ? (
                    <div className="col-span-full flex justify-center py-20 grayscale opacity-50">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : ads.map(ad => (
                    <div key={ad.id} className="bg-[#1e293b] rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden group hover:border-amber-500/30 transition-all flex flex-col">
                        <div className="h-48 w-full overflow-hidden relative">
                            <img src={ad.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.title} />
                            {!ad.is_active && (
                                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center">
                                    <span className="bg-slate-800 text-white text-[10px] font-black px-6 py-2.5 rounded-full border border-white/5 uppercase tracking-[0.2em]">Paused</span>
                                </div>
                            )}
                            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/10">
                                Active Campaign
                            </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-black uppercase tracking-tight text-white text-xl mb-6 line-clamp-1">{ad.title}</h3>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
                                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-widest">Reach</p>
                                    <p className="font-black text-2xl text-white">{ad.impressions_count.toLocaleString()}</p>
                                    <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Impressions</p>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
                                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-widest">Engagement</p>
                                    <p className="font-black text-2xl text-amber-500">{ad.clicks_count.toLocaleString()}</p>
                                    <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Clicks</p>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center gap-3">
                                <button
                                    onClick={() => toggleAd(ad.id, ad.is_active)}
                                    className={`h-14 flex-1 ${ad.is_active ? 'bg-slate-800 text-slate-400' : 'bg-amber-500 text-slate-900'} font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2`}
                                >
                                    <span className="material-symbols-outlined text-sm font-black">{ad.is_active ? 'pause_circle' : 'play_circle'}</span>
                                    {ad.is_active ? 'Pause' : 'Resume'}
                                </button>
                                <button
                                    onClick={() => deleteAd(ad.id)}
                                    className="h-14 w-14 bg-slate-800 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all"
                                >
                                    <span className="material-symbols-outlined font-black text-sm">delete_forever</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {DialogComponent}
        </div>
    );
}
