import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import PostCard from '@/components/PostCard';

interface Props {
    params: Promise<{ id: string }>;
}

const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const { data: post } = await supabaseServer
        .from('posts')
        .select('content, media_url, profiles:author_id (full_name)')
        .eq('id', id)
        .single();

    if (!post) return { title: 'Post | catchstr' };

    const author = (post.profiles as any)?.full_name ?? 'catchstr Player';
    const description = post.content || `Highlight by ${author} on catchstr`;
    const image = post.media_url?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? post.media_url : '/og-image.png';

    return {
        title: `${author} on catchstr`,
        description,
        openGraph: {
            title: `${author} on catchstr`,
            description,
            images: [image],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${author} on catchstr`,
            description,
            images: [image],
        },
    };
}

export default async function PostPage({ params }: Props) {
    const { id } = await params;

    const { data: post } = await supabaseServer
        .from('posts')
        .select('*, profiles:author_id (id, full_name, role, position, location, avatar_url)')
        .eq('id', id)
        .single();

    if (!post) notFound();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <div className="max-w-xl mx-auto py-8 px-0 sm:px-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm">
                    {/* ✅ Server-rendered for SEO — no has_liked/has_saved (not authenticated) */}
                    <PostCard post={{ ...post, has_liked: false, has_saved: false }} currentUserId={null} />
                </div>
                <div className="mt-6 text-center">
                    <a href="/" className="text-sm font-bold text-primary hover:underline">
                        See more highlights on catchstr →
                    </a>
                </div>
            </div>
        </div>
    );
}
