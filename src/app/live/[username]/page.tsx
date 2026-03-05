import { supabase } from '@/lib/supabase';
import MuxPlayer from '@mux/mux-player-react';
import LiveChat from '@/components/live/LiveChat';
import { notFound } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import ViewerCount from '@/components/live/ViewerCount';
import FloatingReactions from '@/components/live/FloatingReactions';
import ClipButton from '@/components/live/ClipButton';

export default async function ViewerPage({ params }: any) {    // 1. Find the user by username to get their ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, name, full_name')
        .eq('username', params.username)
        .single();

    if (!profile) {
        notFound();
    }

    // 2. See if this user has an active stream
    const { data: activeStream } = await supabase
        .from('active_streams')
        .select('id, user_id, stream_id, playback_id, status')
        .eq('user_id', profile.id)
        .eq('status', 'live')
        .maybeSingle();

    // 3. Get the current viewer's session for the chat
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ? {
        id: session.user.id,
        name: session.user.user_metadata?.name || session.user.email
    } : null;


    return (
        <div className="max-w-[1600px] mx-auto py-6 px-4 sm:px-6 h-[calc(100vh-80px)]">
            <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-primary">
                    <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`} alt={profile.username} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        {profile.name || profile.username}
                        {activeStream && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Live</span>
                        )}
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">@{profile.username}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-100px)]">
                {/* Video Player Area */}
                <div className="lg:col-span-3 h-full flex flex-col">
                    <div className="flex-1 bg-black rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl relative">
                        {activeStream ? (
                            <>
                                <div className="absolute top-0 left-0 z-50">
                                    <ViewerCount streamId={activeStream.stream_id} />
                                </div>
                                <FloatingReactions streamId={activeStream.stream_id} isBroadcaster={false} />
                                {currentUser && (
                                    <ClipButton streamId={activeStream.stream_id} currentUserId={currentUser.id} />
                                )}
                                <MuxPlayer
                                    streamType="live"
                                    playbackId={activeStream.playback_id}
                                    metadata={{
                                        video_title: `${profile.username}'s Live Stream`,
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                    autoPlay
                                    muted={false}
                                />
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-900/50">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-500">
                                    <PlayCircle className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Stream Offline</h2>
                                <p className="text-slate-400 max-w-md mx-auto">
                                    {profile.username} is not currently broadcasting. Check back later or follow them to be notified when they go live.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Chat Panel */}
                <div className="lg:col-span-1 border border-slate-800 rounded-[32px] bg-card shadow-2xl flex flex-col overflow-hidden h-full">
                    <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                        <h2 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            Live Chat
                        </h2>
                    </div>
                    <div className="flex-1 p-0 m-0 overflow-hidden relative">
                        {activeStream && currentUser ? (
                            <LiveChat streamId={activeStream.stream_id} currentUser={currentUser} />
                        ) : !currentUser ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center bg-slate-900/20 px-8">
                                <p className="text-sm font-medium mb-4">Please sign in to participate in the chat.</p>
                                <a href="/login" className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-bold transition-colors">Sign In</a>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">chat_bubble_outline</span>
                                <p className="text-sm">Chat is disabled while the stream is offline.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
