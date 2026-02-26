'use client';
import { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
    src: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Auto-play / pause based on intersection observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (videoRef.current) {
                        if (entry.isIntersecting) {
                            videoRef.current.play().catch(() => {
                                // Autoplay was probably blocked by browser policy without user interaction
                                setIsPlaying(false);
                            });
                            setIsPlaying(true);
                        } else {
                            videoRef.current.pause();
                            setIsPlaying(false);
                        }
                    }
                });
            },
            { threshold: 0.6 } // Play when 60% of the video is visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, []);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setDuration(total);
            if (total > 0) {
                setProgress((current / total) * 100);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const newTime = (Number(e.target.value) / 100) * duration;
            videoRef.current.currentTime = newTime;
            setProgress(Number(e.target.value));
        }
    };

    return (
        <div
            ref={containerRef}
            className="group relative w-full bg-black flex justify-center overflow-hidden h-[400px] sm:h-[600px] cursor-pointer"
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
            />

            {/* Play/Pause Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-4xl filled shadow-sm">play_arrow</span>
                    </div>
                </div>
            )}

            {/* Controls Overlay (appears on hover) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="h-full bg-primary bg-gradient-to-r from-primary to-pitch-green rounded-full transition-all duration-75"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={togglePlay}
                        className="text-white hover:text-primary transition-colors focus:outline-none"
                    >
                        <span className="material-symbols-outlined filled text-[28px]">
                            {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                    </button>

                    <button
                        onClick={toggleMute}
                        className="text-white hover:text-primary transition-colors focus:outline-none"
                    >
                        <span className="material-symbols-outlined filled text-[24px]">
                            {isMuted ? 'volume_off' : 'volume_up'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
