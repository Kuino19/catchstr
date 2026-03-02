'use client';
import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import Link from 'next/link';

export default function CreateHighlightPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isStory = searchParams.get('type') === 'story';

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Video Trimming State
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(60);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const url = URL.createObjectURL(selectedFile);
            setFile(selectedFile);
            setPreviewUrl(url);

            if (selectedFile.type.startsWith('video/')) {
                const tempVideo = document.createElement('video');
                tempVideo.src = url;
                tempVideo.onloadedmetadata = () => {
                    const dur = tempVideo.duration;
                    setDuration(dur);
                    setStartTime(0);
                    // Default to 60s or full duration
                    setEndTime(isStory ? Math.min(dur, 60) : dur);
                };
            }
        }
    };

    const handleUpload = async () => {
        if (!file && !content.trim()) return;

        // Validation for stories
        if (isStory && file?.type.startsWith('video/') && (endTime - startTime) > 60) {
            alert('Stories cannot be longer than 60 seconds. Please trim your video.');
            return;
        }

        setUploading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error('Not authenticated');

            let publicUrl = null;

            // 1. Upload to Supabase Storage (Only if file exists)
            if (file) {
                let finalFile = file;
                if (file.type.startsWith('image/')) {
                    const options = {
                        maxSizeMB: 1.5,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    };
                    finalFile = await imageCompression(file, options);
                }

                const fileExt = finalFile.name.split('.').pop() || (file.type.startsWith('video/') ? 'mp4' : 'jpg');
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${session.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(filePath, finalFile);

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: { publicUrl: url } } = supabase.storage
                    .from('media')
                    .getPublicUrl(filePath);

                publicUrl = url;
            }

            // 3. Insert into Posts or Stories Table
            if (isStory) {
                const { error: insertError } = await supabase
                    .from('stories')
                    .insert([
                        {
                            author_id: session.user.id,
                            media_url: publicUrl,
                            content: content.trim() || null,
                            // Store trim metadata if needed, for now we just restrict duration
                        }
                    ]);
                if (insertError) throw insertError;
            } else {
                const tagsArray = tagsInput
                    .split(' ')
                    .map((t: string) => t.trim())
                    .filter((t: string) => t.startsWith('#') && t.length > 1);

                const { error: insertError } = await supabase
                    .from('posts')
                    .insert([
                        {
                            author_id: session.user.id,
                            content: content.trim() || null,
                            media_url: publicUrl,
                            tags: tagsArray
                        }
                    ]);

                if (insertError) throw insertError;
            }

            // Success! 
            alert(isStory ? 'Story posted successfully!' : 'Post shared with the world!');
            window.location.href = '/';
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message || 'Check connection'}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 font-display text-slate-900 dark:text-white h-screen flex flex-col overflow-hidden">
            <header className="flex-none px-4 pt-4 pb-4 flex items-center justify-between bg-white dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-[28px]">close</span>
                </button>
                <h1 className="text-lg font-bold">{isStory ? 'New Story' : 'New Post'}</h1>
                <button
                    onClick={handleUpload}
                    disabled={(!file && !content.trim()) || uploading}
                    className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {uploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            Posting...
                        </>
                    ) : 'Post'}
                </button>
            </header>

            <main className="flex-1 flex flex-col p-4 overflow-y-auto no-scrollbar pb-24">

                <textarea
                    placeholder={isStory ? "Type your story context here..." : "What do you want to share with your network?"}
                    className={`w-full bg-transparent border-none focus:ring-0 resize-none text-lg placeholder-slate-400 dark:placeholder-slate-500 min-h-[100px] ${isStory && !file ? 'text-center text-2xl font-semibold my-auto flex-1' : ''}`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                {!isStory && (
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">tag</span>
                        <input
                            type="text"
                            placeholder="Add tags e.g. #Training #TopBins"
                            className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-slate-400 dark:placeholder-slate-500 font-medium text-primary"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                        />
                    </div>
                )}

                {!previewUrl ? (
                    <div className="flex flex-col gap-4 mt-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                                <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                            </div>
                            <p className="font-semibold">Tap to select Media</p>
                            <p className="text-sm text-slate-500 mt-1">Images or short video clips</p>
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                        </div>

                        <Link
                            href="/live/studio"
                            className="flex flex-col items-center justify-center border border-red-500/20 bg-red-50 dark:bg-red-500/10 rounded-2xl p-8 cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group"
                        >
                            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-2 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">podcasts</span>
                            </div>
                            <p className="font-bold text-red-600 dark:text-red-400 text-lg">Go Live Now</p>
                            <p className="text-sm text-slate-500 mt-1 text-center max-w-[250px]">Start a real-time broadcast and engage with your audience actively.</p>
                        </Link>
                    </div>
                ) : (
                    <div className="relative mt-4 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm p-2">
                        {file?.type.startsWith('video') ? (
                            <div className="flex flex-col gap-4">
                                <video
                                    ref={videoRef}
                                    src={previewUrl}
                                    className="w-full max-h-[300px] object-contain rounded-xl"
                                    onTimeUpdate={() => {
                                        if (videoRef.current && videoRef.current.currentTime >= endTime) {
                                            videoRef.current.currentTime = startTime;
                                        }
                                    }}
                                />

                                <div className="px-2 pb-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cut Clip ({Math.round(endTime - startTime)}s)</h3>
                                        <div className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                                            {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-400">Start Time</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration}
                                                step="0.1"
                                                value={startTime}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setStartTime(val);
                                                    if (val >= endTime) setEndTime(Math.min(val + 1, duration));
                                                    if (videoRef.current) videoRef.current.currentTime = val;
                                                }}
                                                className="w-full accent-primary"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-400">End Time {isStory && <span className="text-red-500 font-bold ml-1">(Max 60s)</span>}</span>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max={duration}
                                                step="0.1"
                                                value={endTime}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setEndTime(val);
                                                    if (val <= startTime) setStartTime(Math.max(0, val - 1));
                                                    if (videoRef.current) videoRef.current.currentTime = val;
                                                }}
                                                className="w-full accent-primary"
                                            />
                                        </div>
                                    </div>

                                    {isStory && (endTime - startTime) > 60 && (
                                        <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">warning</span>
                                            Clip exceeds 1 minute limit for stories!
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-contain" />
                        )}
                        <button
                            onClick={() => { setFile(null); setPreviewUrl(null); }}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"
                />

            </main>
        </div>
    );
}
