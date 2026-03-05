import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

export const revalidate = 0; // Don't cache this page

export default async function LiveDiscoveryPage() {
    // Fetch all active live streams
    const { data: activeStreams } = await supabase
        .from('active_streams')
        .select('id, user_id, stream_id, playback_id, status, created_at')
        .eq('status', 'live')
        .order('created_at', { ascending: false });

    // Fetch associated profiles manually to avoid Foreign Key issues
    let streamsWithProfiles: any[] = [];

    if (activeStreams && activeStreams.length > 0) {
        const userIds = activeStreams.map(s => s.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, name')
            .in('id', userIds);

        if (profiles) {
            const profilesMap = new Map(profiles.map(p => [p.id, p]));
            streamsWithProfiles = activeStreams.map((stream) => ({
                ...stream,
                profile: profilesMap.get(stream.user_id)
            })).filter(s => s.profile); // Only keep ones where we found a profile
        }
    }

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        Live Now
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Discover creators streaming right now.</p>
                </div>
            </div>

            {streamsWithProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-slate-200 dark:border-slate-800 rounded-3xl min-h-[400px]">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
                        <PlayCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-tight mb-2">No active streams</h2>
                    <p className="text-slate-500 max-w-sm">
                        It's quiet right now. Check back later or start your own broadcast!
                    </p>
                    <Link
                        href="/live/studio"
                        className="mt-6 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                        Go Live
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {streamsWithProfiles.map((stream) => (
                        <Link
                            key={stream.id}
                            href={`/live/${stream.profile.username}`}
                            className="group block"
                        >
                            {/* Card Wrapper */}
                            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-primary transition-colors shadow-lg shadow-black/5 hover:shadow-primary/10">

                                {/* Thumbnail Placeholder using Mux (or fallback image) */}
                                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                                    <img
                                        src={`https://image.mux.com/${stream.playback_id}/thumbnail.png?width=640&height=360&fit_mode=crop`}
                                        alt={`${stream.profile.username}'s stream`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            // Fallback if thumbnail is not ready
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${stream.profile.username}&background=random&size=640`;
                                        }}
                                    />
                                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-black flex items-center gap-1.5 shadow-lg">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        LIVE
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white">
                                        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px]">group</span>
                                            {/* We will add real viewer count later */}
                                            --
                                        </div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="p-4 flex gap-3 items-start relative">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden shrink-0 relative bg-slate-800">
                                        <img
                                            src={stream.profile.avatar_url || `https://ui-avatars.com/api/?name=${stream.profile.username}`}
                                            alt={stream.profile.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Text */}
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                            {stream.profile.name || stream.profile.username}'s Stream
                                        </h3>
                                        <p className="text-sm text-slate-500 truncate">@{stream.profile.username}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
