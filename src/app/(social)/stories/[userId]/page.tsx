'use client';
import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
}

interface Story {
    id: string;
    author_id: string;
    media_url: string | null;
    content: string | null;
    created_at: string;
    profiles: Profile;
}

export default function StoryViewerPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const router = useRouter();
    const [stories, setStories] = useState<Story[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Time progress bar state
    const [progress, setProgress] = useState(0);
    const STORY_DURATION = 5000; // 5 seconds per story

    useEffect(() => {
        async function fetchStories() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) setCurrentUserId(session.user.id);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { data, error } = await supabase
                .from('stories')
                .select(`*, profiles:author_id (*)`)
                .eq('author_id', userId)
                .gte('created_at', yesterday.toISOString())
                .order('created_at', { ascending: true }); // chronological

            if (data && data.length > 0) {
                setStories(data as unknown as Story[]);
            } else {
                // No stories found or error, return to feed
                router.push('/');
            }
            setLoading(false);
        }

        fetchStories();
    }, [userId, router]);

    useEffect(() => {
        if (loading || stories.length === 0) return;

        setProgress(0);
        const interval = 50; // Update progress every 50ms
        const step = (interval / STORY_DURATION) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                const nextVal = prev + step;
                return nextVal > 100 ? 100 : nextVal;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, loading, stories.length]);

    useEffect(() => {
        if (progress >= 100) {
            handleNext();
        }
    }, [progress]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            router.push('/');
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleDeleteStory = async (storyId: string) => {
        if (!confirm('Delete this story?')) return;

        const { error } = await supabase
            .from('stories')
            .delete()
            .eq('id', storyId);

        if (error) {
            alert('Error deleting story: ' + error.message);
        } else {
            // Remove from local state
            const updatedStories = stories.filter(s => s.id !== storyId);
            if (updatedStories.length === 0) {
                router.push('/');
            } else {
                setStories(updatedStories);
                setCurrentIndex(prev => Math.min(prev, updatedStories.length - 1));
                setProgress(0);
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (stories.length === 0) return null;

    const currentStory = stories[currentIndex];

    return (
        <div className="bg-black min-h-screen flex flex-col font-display text-white overflow-hidden relative selection:bg-transparent">

            {/* Absolute Header (Progress Bars + Profile) */}
            <div className="absolute top-0 left-0 w-full z-50 p-4 bg-gradient-to-b from-black/60 to-transparent">

                {/* Progress Bars */}
                <div className="flex gap-1.5 mb-3">
                    {stories.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all ease-linear"
                                style={{
                                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Profile Info & Close Base */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 relative">
                            {currentStory.profiles?.avatar_url ? (
                                <Image
                                    src={currentStory.profiles.avatar_url}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <span className="material-symbols-outlined text-slate-400 m-2">person</span>
                            )}
                        </div>
                        <p className="font-semibold text-sm shadow-sm">{currentStory.profiles?.full_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentUserId === currentStory.author_id && (
                            <button
                                onClick={() => handleDeleteStory(currentStory.id)}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition"
                                title="Delete Story"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        )}
                        <button onClick={() => router.push('/')} className="p-2 hover:bg-white/10 rounded-full transition">
                            <span className="material-symbols-outlined text-white">close</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black">
                {/* If Media Exists, show it */}
                {currentStory.media_url && currentStory.media_url.includes('.mp4') ? (
                    <video
                        src={currentStory.media_url}
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        className="absolute inset-0 w-full h-full object-contain"
                    />
                ) : currentStory.media_url ? (
                    <Image
                        src={currentStory.media_url}
                        alt="Story Content"
                        fill
                        className="object-contain"
                        priority
                        quality={90}
                    />
                ) : null}

                {/* Preload Next Content */}
                {currentIndex < stories.length - 1 && (
                    <div className="hidden">
                        {stories[currentIndex + 1].media_url?.includes('.mp4') ? (
                            <video src={stories[currentIndex + 1].media_url!} preload="auto" />
                        ) : (
                            <img src={stories[currentIndex + 1].media_url!} />
                        )}
                    </div>
                )}

                {/* Text Overlay (if content exists, or if text-only story) */}
                {currentStory.content && (
                    <div className={`p-6 text-center z-10 ${!currentStory.media_url ? 'bg-gradient-to-br from-indigo-500 to-primary absolute inset-0 flex items-center justify-center' : 'absolute bottom-1/4 w-full bg-black/40 backdrop-blur-md'}`}>
                        <h1 className={`${!currentStory.media_url ? 'text-4xl font-bold max-w-sm mx-auto' : 'text-lg font-medium'}`}>
                            {currentStory.content}
                        </h1>
                    </div>
                )}
            </div>

            {/* Invisible Touch Zones for Navigation */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-40" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-2/3 z-40" onClick={handleNext} />
        </div>
    );
}
