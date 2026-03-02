'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import PostCard from '@/components/PostCard';
import { supabase } from '@/lib/supabase';

// Reuse the Post interface
interface Profile {
    id: string;
    full_name: string;
    role: string;
    position: string;
    location: string;
    avatar_url: string;
}

interface Post {
    id: string;
    content: string;
    media_url: string;
    likes_count: number;
    created_at: string;
    profiles: Profile;
    has_liked?: boolean;
    has_saved?: boolean;
}

export default function SavedPostsPage() {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSavedPosts() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            const userId = session.user.id;
            setCurrentUserId(userId);

            // Fetch saved posts mapping to the full post object and profile
            const { data, error } = await supabase
                .from('saved_posts')
                .select(`
                    post_id,
                    posts (
                        *,
                        profiles:author_id (*)
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (data && !error) {
                // Supabase returns related tables as nested objects or arrays of objects. 
                // Because we're doing a one-to-one mapping (a saved_post connects to one post), `posts` is an object.
                const formattedPosts: Post[] = data
                    .map((item: any) => item.posts as Post)
                    .filter(post => post !== null); // safeguard against deleted posts still existing in saved_posts

                setSavedPosts(formattedPosts);
            } else if (error) {
                console.error("Error fetching saved posts:", error);
            }

            setLoading(false);
        }

        fetchSavedPosts();
    }, [router]);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20 font-display">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()} className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Saved Highlights</h1>
            </header>

            <main className="flex flex-col gap-6 pt-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : savedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-24 px-8 text-center opacity-60">
                        <span className="material-symbols-outlined text-5xl mb-3 text-slate-400">bookmark_border</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Saved Posts</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">When you bookmark a highlight or post, it will appear here for easy access.</p>
                    </div>
                ) : (
                    savedPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={currentUserId}
                        />
                    ))
                )}
            </main>

            <BottomNav />
        </div>
    );
}
