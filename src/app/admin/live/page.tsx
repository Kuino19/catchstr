'use client';

import { useState, useEffect } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import LiveChat from '@/components/live/LiveChat';
import { PlayCircle, Key, RefreshCw, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AdminLiveStudio() {
    const [stream, setStream] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function getUser() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser({ id: session.user.id, name: session.user.user_metadata?.name || session.user.email });
            }
        }
        getUser();
    }, []);

    const createLiveStream = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/mux/live-streams', {
                method: 'POST',
            });
            const data = await response.json();
            setStream(data);
        } catch (error) {
            console.error('Error creating stream:', error);
            toast.error('Failed to create live stream. Please check Mux API keys.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, type: 'key' | 'url') => {
        navigator.clipboard.writeText(text);
        if (type === 'key') {
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        } else {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Live Studio
                    </h1>
                    <p className="text-muted-foreground mt-1">Broadcast to your audience and chat in real-time.</p>
                </div>

                {!stream && (
                    <button
                        onClick={createLiveStream}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                        {isLoading ? 'Generating Stream Keys...' : 'Create Live Stream'}
                    </button>
                )}
            </div>

            {stream ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stream Preview & Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                            <div className="aspect-video bg-black relative flex items-center justify-center">
                                {stream.playback_ids && stream.playback_ids[0] ? (
                                    <MuxPlayer
                                        streamType="live"
                                        playbackId={stream.playback_ids[0].id}
                                        metadata={{
                                            video_id: stream.id,
                                            video_title: 'Admin Live Stream',
                                        }}
                                        style={{ width: '100%', height: '100%' }}
                                        autoPlay
                                        muted
                                    />
                                ) : (
                                    <div className="text-white/50 text-center">
                                        <p className="text-lg">Waiting for stream...</p>
                                        <p className="text-sm mt-2">Start broadcasting from your software to see the preview.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5 text-blue-500" />
                                Stream Settings
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">RTMP URL</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            readOnly
                                            value="rtmps://global-live.mux.com:443/app"
                                            className="flex-1 bg-background border border-border rounded-l-md px-3 py-2 text-sm text-foreground focus:outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard('rtmps://global-live.mux.com:443/app', 'url')}
                                            className="bg-secondary px-4 border border-l-0 border-border rounded-r-md hover:bg-secondary/80 transition-colors"
                                        >
                                            {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Stream Key</label>
                                    <div className="flex">
                                        <input
                                            type="password"
                                            readOnly
                                            value={stream.stream_key}
                                            className="flex-1 bg-background border border-border rounded-l-md px-3 py-2 text-sm text-foreground focus:outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(stream.stream_key, 'key')}
                                            className="bg-secondary px-4 border border-l-0 border-border rounded-r-md hover:bg-secondary/80 transition-colors"
                                        >
                                            {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Keep your Stream Key secret. Anyone with this key can broadcast to your channel.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Chat */}
                    <div className="lg:col-span-1 border border-border rounded-xl bg-card shadow-sm h-[600px] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h2 className="font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Live Chat
                            </h2>
                        </div>
                        <div className="flex-1 p-0 m-0 overflow-hidden relative">
                            <LiveChat streamId={stream.id} currentUser={user} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-xl border border-border shadow-sm">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PlayCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Ready to broadcast?</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Click the button above to generate your RTMP stream keys. You can use OBS Studio, Streamlabs, or any standard RTMP broadcasting software.
                    </p>
                </div>
            )}
        </div>
    );
}
