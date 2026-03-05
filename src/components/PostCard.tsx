'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import VideoPlayer from '@/components/VideoPlayer';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/ConfirmDialog';

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
    is_mux_asset?: boolean;
}

interface PostCardProps {
    post: Post;
    currentUserId: string | null;
    /** Called after post is deleted so the parent can remove it from state */
    onDelete?: (postId: string) => void;
}

/** Derive the Mux playback ID from a media URL if it's a Mux stream URL.
 *  Returns undefined for regular file URLs.
 */
function getMuxPlaybackId(mediaUrl: string): string | undefined {
    // Mux HLS streams look like: https://stream.mux.com/{playbackId}.m3u8
    const match = mediaUrl?.match(/stream\.mux\.com\/([^.]+)/);
    return match?.[1] ?? undefined;
}

export default function PostCard({ post: initialPost, currentUserId, onDelete }: PostCardProps) {
    // ✅ has_liked / has_saved come from parent (batched in feed). No useEffect DB calls.
    const [post, setPost] = useState<Post>(initialPost);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Comments State
    const [showComments, setShowComments] = useState(false);
    const { confirm: confirmDialog, DialogComponent } = useConfirm();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    const handleLike = async () => {
        if (!currentUserId || isLiking) return;
        setIsLiking(true);
        const currentlyLiked = post.has_liked;
        setPost(prev => ({
            ...prev,
            has_liked: !currentlyLiked,
            likes_count: currentlyLiked ? prev.likes_count - 1 : prev.likes_count + 1
        }));
        const { error } = await supabase.rpc('toggle_like', { post_uuid: post.id });
        if (error) {
            setPost(prev => ({
                ...prev,
                has_liked: currentlyLiked,
                likes_count: currentlyLiked ? prev.likes_count + 1 : prev.likes_count - 1
            }));
        }
        setIsLiking(false);
    };

    const handleSave = async () => {
        if (!currentUserId || isSaving) return;
        setIsSaving(true);
        const currentlySaved = post.has_saved;
        setPost(prev => ({ ...prev, has_saved: !currentlySaved }));
        if (currentlySaved) {
            const { error } = await supabase.from('saved_posts').delete().eq('user_id', currentUserId).eq('post_id', post.id);
            if (error) setPost(prev => ({ ...prev, has_saved: true }));
        } else {
            const { error } = await supabase.from('saved_posts').insert([{ user_id: currentUserId, post_id: post.id }]);
            if (error) setPost(prev => ({ ...prev, has_saved: false }));
        }
        setIsSaving(false);
    };

    const handleShare = async () => {
        const postUrl = `${window.location.origin}/post/${post.id}`;
        const shareData = {
            title: `catchstr — ${post.profiles?.full_name || 'Player'}'s highlight`,
            text: post.content || `Check out this highlight by ${post.profiles?.full_name || 'Player'} on catchstr!`,
            url: postUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(postUrl);
                toast.success('Link copied to clipboard!');
            }
        } catch { /* user cancelled share */ }
    };

    const handleDelete = async () => {
        const ok = await confirmDialog({
            title: 'Delete highlight?',
            message: 'This cannot be undone. Your highlight will be permanently removed.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        const { error } = await supabase.from('posts').delete().eq('id', post.id);
        if (error) {
            toast.error('Failed to delete highlight.');
        } else {
            toast.success('Highlight deleted.');
            onDelete?.(post.id);
        }
    };

    const loadComments = async () => {
        if (showComments) { setShowComments(false); return; }
        setShowComments(true);
        setIsLoadingComments(true);
        const { data, error } = await supabase
            .from('comments')
            .select('*, profiles:author_id (id, full_name, avatar_url, role)')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });
        if (data && !error) setComments(data);
        setIsLoadingComments(false);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId) return;
        const commentText = newComment.trim();
        setNewComment('');
        const { data, error } = await supabase
            .from('comments')
            .insert([{ post_id: post.id, author_id: currentUserId, content: commentText }])
            .select('*, profiles:author_id (id, full_name, avatar_url, role)')
            .single();
        if (data && !error) {
            setComments(prev => [...prev, data]);
            // ✅ Correct notification type: 'comment' not 'message'
            if (post.profiles.id !== currentUserId) {
                await supabase.from('notifications').insert([{
                    user_id: post.profiles.id,
                    actor_id: currentUserId,
                    type: 'comment',
                    post_id: post.id
                }]);
            }
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    // ✅ Mux thumbnail as video poster
    const muxPlaybackId = post.media_url ? getMuxPlaybackId(post.media_url) : undefined;
    const muxPoster = muxPlaybackId ? `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?time=0` : undefined;
    const isVideo = post.media_url?.match(/\.(mp4|webm|ogg|mov)$/i) || post.is_mux_asset;

    return (
        <article className="flex flex-col border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="px-4 flex items-center justify-between mb-3">
                <Link href={`/profile/${post.profiles?.id}`} className="flex items-center gap-3">
                    <div className="relative">
                        {post.profiles?.avatar_url ? (
                            <Image
                                alt={`${post.profiles.full_name} profile`}
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                                src={post.profiles.avatar_url}
                                width={40}
                                height={40}
                                priority={false}
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400">person</span>
                            </div>
                        )}
                        {post.profiles?.position && (
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-background-dark flex items-center justify-center">
                                {post.profiles.position}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                {post.profiles?.full_name || 'Unknown User'}
                            </h3>
                            {post.profiles?.role === 'Agent' && (
                                <span className="material-symbols-outlined text-yellow-500 text-[14px] filled">star</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {post.profiles?.location || 'Unknown Location'} • {post.profiles?.role || 'Player'}
                        </p>
                    </div>
                </Link>
                <div className="flex items-center gap-2">
                    {/* ✅ View individual post */}
                    <Link href={`/post/${post.id}`} className="text-slate-400 hover:text-primary transition-colors p-1" title="View post">
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </Link>
                    {currentUserId === post.profiles?.id && (
                        <button onClick={handleDelete} className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-xs font-bold">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    )}
                    {currentUserId !== post.profiles?.id && (
                        <button className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Media Content */}
            {post.media_url ? (
                <div className="relative w-full overflow-hidden bg-slate-900 border-y border-slate-100 dark:border-slate-800">
                    {isVideo ? (
                        <VideoPlayer src={post.media_url} poster={muxPoster} />
                    ) : (
                        <div className="relative w-full aspect-square sm:aspect-video overflow-hidden">
                            <Image
                                src={post.media_url}
                                alt="Post media"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                quality={75}
                            />
                        </div>
                    )}
                    {post.profiles?.role === 'Player' && isVideo && (
                        <div className="absolute bottom-4 left-4 bg-pitch-green text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
                            <span className="block h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
                            LIVE DRILL
                        </div>
                    )}
                </div>
            ) : (
                <div className="px-4 py-2">
                    <p className="text-sm text-slate-900 dark:text-white mb-2">{post.content}</p>
                </div>
            )}

            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <button onClick={handleLike} className={`group flex items-center gap-1 active:scale-90 transition-transform ${post.has_liked ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                        <span className={`material-symbols-outlined text-[26px] transition-colors ${post.has_liked ? 'filled text-red-500' : 'group-hover:text-red-500'}`}>
                            {post.has_liked ? 'favorite' : 'favorite_border'}
                        </span>
                    </button>
                    <button onClick={loadComments} className={`group flex items-center gap-1 active:scale-90 transition-transform ${showComments ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                        <span className={`material-symbols-outlined text-[26px] transition-colors ${showComments ? 'filled' : 'group-hover:text-primary'}`}>chat_bubble_outline</span>
                    </button>
                    <button onClick={handleShare} className="group flex items-center gap-1 text-slate-900 dark:text-white active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-[26px] group-hover:text-primary transition-colors">send</span>
                    </button>
                </div>
                <button onClick={handleSave} className={`active:scale-90 transition-transform ${post.has_saved ? 'text-primary' : 'text-slate-900 dark:text-white hover:text-primary'}`}>
                    <span className={`material-symbols-outlined text-[26px] ${post.has_saved ? 'filled' : ''}`}>
                        {post.has_saved ? 'bookmark' : 'bookmark_border'}
                    </span>
                </button>
            </div>

            <div className="px-4 flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{post.likes_count || 0} likes</p>
                {post.content && (
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white mr-2">{post.profiles?.full_name || 'Unknown User'}</span>
                        {post.content}
                    </div>
                )}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-wide">{formatTimeAgo(post.created_at)}</p>
            </div>

            {/* Expandable Comments Section */}
            {showComments && (
                <div className="px-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                    {isLoadingComments ? (
                        <div className="flex justify-center p-4">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {comments.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-2">No comments yet. Be the first to reply!</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2">
                                        {comment.profiles?.avatar_url ? (
                                            <Image src={comment.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" alt="Avatar" width={32} height={32} />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex flex-shrink-0 items-center justify-center mt-0.5">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-2xl rounded-tl-none px-3 py-2 w-full">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                                {comment.profiles?.full_name}
                                                {comment.profiles?.role === 'Agent' && <span className="material-symbols-outlined text-[12px] text-yellow-500 filled">star</span>}
                                            </h4>
                                            <p className="text-sm text-slate-800 dark:text-slate-200">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-sm rounded-full px-4 py-2 border-none focus:ring-0 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                />
                                <button type="submit" disabled={!newComment.trim() || !currentUserId} className="text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600 transition-colors p-2">
                                    <span className="material-symbols-outlined text-[20px] filled">send</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
