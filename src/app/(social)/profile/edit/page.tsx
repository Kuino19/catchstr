'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import toast from 'react-hot-toast';

interface Profile {
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Profile>({
        full_name: '',
        role: 'Player',
        position: '',
        location: '',
        bio: '',
        avatar_url: '',
        banner_url: ''
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, role, position, location, bio, avatar_url, banner_url')
                .eq('id', session.user.id)
                .maybeSingle();

            if (data) {
                setProfile(data);
                setAvatarPreview(data.avatar_url);
            }
            setLoading(false);
        }
        loadProfile();
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("No session");

            let finalAvatarUrl = profile.avatar_url;

            // Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${session.user.id}/avatar-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('media')
                    .getPublicUrl(fileName);

                finalAvatarUrl = publicUrl;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    role: profile.role,
                    position: profile.position,
                    location: profile.location,
                    bio: profile.bio,
                    avatar_url: finalAvatarUrl
                })
                .eq('id', session.user.id);

            if (updateError) throw updateError;

            router.push('/profile');
            router.refresh();
        } catch (error: any) {
            toast.error('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased pb-24 min-h-screen">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <Link href="/profile" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">close</span>
                </Link>
                <h1 className="text-lg font-bold tracking-tight">Edit Profile</h1>
                <button
                    form="edit-profile-form"
                    disabled={saving}
                    className="text-primary font-bold disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Done'}
                </button>
            </header>

            <main className="p-6 max-w-lg mx-auto">
                <form id="edit-profile-form" onSubmit={handleSave} className="space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-400 text-4xl">person</span>
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="material-symbols-outlined">add_a_photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Change Profile Photo</p>
                    </div>

                    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary px-4 py-3 text-sm font-medium"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bio</label>
                            <textarea
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary px-4 py-3 text-sm font-medium min-h-[100px] resize-none"
                                placeholder="Tell the community about yourself..."
                            />
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">I am an</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Player', 'Agent'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setProfile({ ...profile, role: r })}
                                        className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${profile.role === r
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Position / Title</label>
                            <input
                                type="text"
                                value={profile.position}
                                onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary px-4 py-3 text-sm font-medium"
                                placeholder={profile.role === 'Agent' ? 'e.g. FIFA Licensed Agent' : 'e.g. Striker / Forward'}
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Location</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                                <input
                                    type="text"
                                    value={profile.location}
                                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary pl-11 pr-4 py-3 text-sm font-medium"
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            <BottomNav />
        </div>
    );
}
