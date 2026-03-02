'use client';

import { useState, useEffect, useRef } from 'react';
import LiveChat from '@/components/live/LiveChat';
import { PlayCircle, StopCircle, Video, Mic, MicOff, VideoOff, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FloatingReactions from '@/components/live/FloatingReactions';
import Link from 'next/link';

export default function UserLiveStudio() {
    const [streamData, setStreamData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Camera state
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Strict lock to prevent React development double-mounts from crashing the camera
    const isInitializingCamera = useRef(false);
    const router = useRouter();

    useEffect(() => {
        async function getUser() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser({ id: session.user.id, name: session.user.user_metadata?.name || session.user.email, email: session.user.email });
            } else {
                router.push('/login');
            }
        }
        getUser();

        return () => {
            stopCamera();
            endBroadcast();
        };
    }, []);

    const startCamera = async () => {
        if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Camera access is not supported in this environment.");
            return;
        }

        // Lock to prevent race conditions
        if (isInitializingCamera.current || streamRef.current) return;
        isInitializingCamera.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError("Could not access camera/microphone. Please check browser permissions.");
        } finally {
            isInitializingCamera.current = false;
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Initialize camera once the user has loaded
    useEffect(() => {
        if (user) {
            startCamera();
        }
    }, [user]);

    const toggleMic = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    const goLive = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/mux/live-streams', { method: 'POST' });
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setStreamData(data);

            const peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionRef.current = peerConnection;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    peerConnection.addTrack(track, streamRef.current!);
                });
            }

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            const whipResponse = await fetch(data.webrtc_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: offer.sdp
            });

            if (!whipResponse.ok) {
                throw new Error(`Failed to connect to Mux WebRTC endpoint: ${whipResponse.statusText}`);
            }

            const answerSdp = await whipResponse.text();
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
            );

            setIsLive(true);

            if (user && data.stream) {
                await supabase.from('active_streams').upsert({
                    user_id: user.id,
                    stream_id: data.stream.id,
                    playback_id: data.stream.playback_ids[0].id,
                    status: 'live'
                }, { onConflict: 'user_id' });

                fetch('/api/notifications/live', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        broadcasterId: user.id,
                        broadcasterUsername: user.email.split('@')[0],
                        broadcasterName: user.name
                    })
                }).catch(e => console.error("Failed to trigger notifications:", e));
            }

        } catch (error) {
            console.error('Error going live:', error);
            alert('Failed to connect broadcast. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const endBroadcast = async () => {
        setIsLive(false);

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (user) {
            await supabase.from('active_streams')
                .update({ status: 'ended' })
                .eq('user_id', user.id);
        }
    };


    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Video className="w-12 h-12 text-primary opacity-50" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Initializing Studio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col lg:flex-row z-50">
            {/* Main Video Area (Immersive Mobile / Left Desktop) */}
            <div className="relative flex-1 h-full w-full bg-slate-900 overflow-hidden lg:rounded-r-[40px] shadow-2xl z-10">
                {/* Video Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`}
                />

                {/* Fallback pattern when video is muted/error */}
                {(isVideoMuted || cameraError) && (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
                            {cameraError ? <VideoOff className="w-10 h-10 text-red-400" /> : <VideoOff className="w-10 h-10 text-slate-500" />}
                        </div>
                        <p className="text-xl font-bold mb-2">{cameraError ? 'Camera Error' : 'Camera Muted'}</p>
                        {cameraError && <p className="text-sm text-red-300 max-w-sm">{cameraError}</p>}
                    </div>
                )}

                {/* Overlays (Gradients for readability) */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* Top Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start z-20">
                    <div className="flex gap-3">
                        <Link href="/" onClick={stopCamera} className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center transition-colors">
                            <X className="w-6 h-6" />
                        </Link>
                        {isLive && (
                            <div className="bg-red-500/90 text-white text-[12px] font-black px-4 py-0 rounded-full uppercase tracking-widest backdrop-blur-sm border border-red-400/50 flex items-center gap-2 shadow-lg shadow-red-500/20">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                Live
                            </div>
                        )}
                        {!isLive && (
                            <div className="bg-black/40 text-slate-300 text-[12px] font-black px-4 py-2 rounded-full uppercase tracking-widest backdrop-blur-sm border border-white/10 flex items-center shadow-lg">
                                Ready to Broadcast
                            </div>
                        )}
                    </div>

                    {/* AV Controls (Top Right) */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={toggleMic}
                            className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg ${isMicMuted ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-black/40 hover:bg-black/60 text-white border border-white/10'}`}
                            title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                        >
                            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg ${isVideoMuted ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-black/40 hover:bg-black/60 text-white border border-white/10'}`}
                            title={isVideoMuted ? "Turn on Camera" : "Turn off Camera"}
                        >
                            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {streamData?.stream?.id && isLive && (
                    <FloatingReactions streamId={streamData.stream.id} isBroadcaster={true} />
                )}

                {/* Mobile Bottom Controls (Only visible on small screens when NOT live) */}
                {!isLive && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center justify-end z-20 lg:hidden min-h-[40vh]">
                        <button
                            onClick={goLive}
                            disabled={isLoading}
                            className="w-full max-w-sm bg-primary hover:bg-blue-600 text-white py-5 rounded-full font-black text-xl tracking-wide transition-all shadow-[0_0_40px_rgba(59,130,246,0.5)] disabled:opacity-50 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
                            {isLoading ? 'Connecting...' : 'Go Live Now'}
                        </button>
                        <p className="text-white/60 text-xs font-medium mt-4 text-center max-w-xs">Connecting to Catchstr secure broadcast servers</p>
                    </div>
                )}
            </div>

            {/* Desktop / Tablet Sidebar Area */}
            <div className={`fixed inset-x-0 bottom-0 ${isLive ? 'h-[50vh]' : 'hidden'} lg:flex lg:h-full lg:relative lg:w-[450px] flex-col transform transition-transform z-20 pointer-events-none lg:pointer-events-auto`}>
                <div className="h-full w-full pointer-events-auto flex flex-col lg:bg-[#0a0f1a] pt-12 lg:pt-0">

                    {/* Desktop "Go Live" Header */}
                    <div className="hidden lg:flex p-6 border-b border-transparent lg:border-slate-800 bg-transparent lg:bg-slate-900/40 flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                                <Video className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Studio Controls</h2>
                                <p className="text-sm text-slate-400 font-medium">Manage your broadcast</p>
                            </div>
                        </div>

                        {!isLive ? (
                            <button
                                onClick={goLive}
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-lg shadow-primary/30 disabled:opacity-50 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                                {isLoading ? 'Connecting...' : 'Go Live Now'}
                            </button>
                        ) : (
                            <button
                                onClick={endBroadcast}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-lg shadow-red-500/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <StopCircle className="w-5 h-5" />
                                End Broadcast
                            </button>
                        )}
                    </div>

                    {/* Chat Area - Makes up the bottom half on mobile, full height on desktop */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-transparent lg:bg-[#0a0f1a]">
                        <div className="p-4 flex items-center justify-between pointer-events-none">
                            <h2 className="font-black uppercase tracking-widest text-xs flex items-center gap-2 drop-shadow-md lg:drop-shadow-none">
                                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-primary animate-pulse' : 'bg-slate-600'}`}></span>
                                Live Chat
                            </h2>
                        </div>

                        <div className="flex-1 relative overflow-hidden mask-image:linear-gradient(to_bottom,transparent,black_20px) lg:mask-image-none">
                            {streamData?.stream?.id ? (
                                <LiveChat streamId={streamData.stream.id} currentUser={user} isModerator={true} />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 lg:text-slate-500 p-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 lg:bg-slate-800/50 flex items-center justify-center mb-4 backdrop-blur-md">
                                        <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                                    </div>
                                    <p className="text-sm font-medium">Chat messages will appear here once you go live.</p>
                                </div>
                            )}
                        </div>

                        {/* Mobile End Broadcast (Fixed at bottom when live) */}
                        {isLive && (
                            <div className="lg:hidden p-4 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <button
                                    onClick={endBroadcast}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-full font-black tracking-wide transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <StopCircle className="w-5 h-5" />
                                    End Stream
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
