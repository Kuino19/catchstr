import Link from 'next/link';
import { Play } from 'lucide-react';

interface PastBroadcast {
    id: string;
    created_at: string;
    playback_id: string;
    title: string;
    duration: number;
    views: number;
}

export default function PastBroadcastCard({ broadcast }: { broadcast: PastBroadcast }) {
    // Format duration from seconds to MM:SS
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Format date
    const date = new Date(broadcast.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <Link href={`/live/vod/${broadcast.playback_id}`} className="group block">
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-primary transition-colors shadow-lg shadow-black/5 hover:shadow-primary/10">
                {/* Thumbnail Area */}
                <div className="aspect-video bg-slate-900 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                    <img
                        src={`https://image.mux.com/${broadcast.playback_id}/thumbnail.png?width=640&height=360&fit_mode=crop`}
                        alt="Stream Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-primary/90 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl transform scale-75 group-hover:scale-100 transition-all">
                            <Play className="w-6 h-6 ml-1" />
                        </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-white text-[10px] font-bold tracking-wider">
                        {formatDuration(broadcast.duration)}
                    </div>

                    {/* VOD Badge */}
                    <div className="absolute top-3 left-3 bg-slate-800/80 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-white/10">
                        VOD
                    </div>
                </div>

                {/* Info Area */}
                <div className="p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {broadcast.title || `Live Stream - ${date}`}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                        <span>{date}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            {broadcast.views} views
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
