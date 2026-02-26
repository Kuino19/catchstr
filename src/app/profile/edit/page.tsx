'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    location: string;
    bio: string;
    avatar_url: string;
    banner_url: string;
}

export default function EditProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form inputs
    const [fullName, setFullName] = useState('');
    const [position, setPosition] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadData() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (data) {
                const p = data as Profile;
                setProfile(p);
                setFullName(p.full_name || '');
                setPosition(p.position || '');
                setLocation(p.location || '');
                setBio(p.bio || '');
                setAvatarUrl(p.avatar_url || '');
                setBannerUrl(p.banner_url || '');
            }
            setLoading(false);
        }

        loadData();
    }, [router]);

    const compressAndUploadImage = async (file: File, prefix: string): Promise<string | null> => {
        if (!profile) return null;

        try {
            // Compress image
            const options = {
                maxSizeMB: 1, // max 1MB limit for profile assets
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };
            const compressedFile = await imageCompression(file, options);

            // Upload to Supabase
            const fileExt = compressedFile.name.split('.').pop() || 'jpg';
            const fileName = `${prefix}_${Math.random()}.${fileExt}`;
            const filePath = `${profile.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            return publicUrl;

        } catch (error) {
            console.error('Image compression or upload failed', error);
            alert('Failed to process image.');
            return null;
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSaving(true);
            const url = await compressAndUploadImage(e.target.files[0], 'avatar');
            if (url) setAvatarUrl(url);
            setSaving(false);
        }
    };

    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSaving(true);
            const url = await compressAndUploadImage(e.target.files[0], 'banner');
            if (url) setBannerUrl(url);
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);

        const updates = {
            full_name: fullName,
            position,
            location,
            bio,
            avatar_url: avatarUrl,
            banner_url: bannerUrl,
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profile.id);

        if (error) {
            console.error('Save failed', error);
            alert('Failed to save profile updates.');
        } else {
            router.push('/profile');
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-white min-h-screen">
            <header className="px-4 py-4 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-50 border-b border-divider dark:border-slate-800">
                <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
                <h1 className="text-lg font-bold">Edit Profile</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-primary font-bold hover:text-blue-600 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </header>

            <main className="max-w-md mx-auto w-full px-4 pb-16">

                {/* Visuals Editor */}
                <section className="mt-6 flex flex-col items-center gap-6">
                    {/* Banner Editor */}
                    <div className="w-full relative h-[140px] rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-sm border border-slate-300 dark:border-slate-600">
                        {bannerUrl ? (
                            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-3xl">wallpaper</span>
                                <span className="text-xs font-semibold mt-1">No Banner</span>
                            </div>
                        )}
                        <button
                            onClick={() => bannerInputRef.current?.click()}
                            className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                        </button>
                    </div>

                    {/* Avatar Editor */}
                    <div className="relative -mt-16 z-10 flex flex-col items-center">
                        <div className="relative w-28 h-28 rounded-full border-4 border-slate-50 dark:border-slate-900 overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-md">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-5xl">person</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full border-4 border-slate-50 dark:border-slate-900 hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                        </button>
                    </div>
                </section>

                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />

                {/* Form Fields */}
                <section className="mt-8 flex flex-col gap-5">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Your full name"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Role / Position</label>
                        <input
                            type="text"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="e.g. Center Forward, FIFA Licensed Agent"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="e.g. London, UK"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            placeholder="Tell the network about your journey..."
                        />
                    </div>

                </section>
            </main>
        </div>
    );
}
