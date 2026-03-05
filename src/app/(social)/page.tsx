'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import AdBanner from '@/components/AdBanner';

const PAGE_SIZE = 10;

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

interface Story {
  id: string;
  author_id: string;
  media_url: string;
  created_at: string;
  profiles: Profile;
}

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);       // ✅ Cached at feed level — no per-render DB calls
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [feedMode, setFeedMode] = useState<'following' | 'global'>('following');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const pageRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // ─── Initial Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      pageRef.current = 0;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Fetch current user's profile
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role, position, location, avatar_url')
          .eq('id', userId)
          .single();
        if (profile) setCurrentUserProfile(profile as Profile);

        // Get who the user follows (for filtered feed)
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
          .eq('status', 'accepted');
        const ids = followData?.map(f => f.following_id) || [];
        setFollowingIds(ids);

        // Check unread notifications
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);
        setHasUnreadNotifications(!!(count && count > 0));

        // Subscribe to new notifications in realtime ✅
        const channel = supabase
          .channel(`notifications:${userId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          }, () => {
            setHasUnreadNotifications(true);
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }

      // Fetch ads once, cache locally ✅
      const { data: adsData } = await supabase
        .from('ads')
        .select('id, title, image_url, link_url')
        .eq('is_active', true)
        .limit(8);
      if (adsData) setAds(adsData);

      // Fetch stories
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, author_id, media_url, created_at, profiles:author_id (id, full_name, avatar_url, role, position, location)')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (storiesData) {
        const uniqueStories: any[] = [];
        const seenAuthors = new Set();
        for (const story of storiesData) {
          if (!seenAuthors.has(story.author_id)) {
            uniqueStories.push(story);
            seenAuthors.add(story.author_id);
          }
        }
        setStories(uniqueStories as unknown as Story[]);
      }

      await loadPosts(userId, followingIds, 0, 'following');
      setLoading(false);
    }

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Paginated Post Loader ────────────────────────────────────────────────
  const loadPosts = useCallback(async (
    userId: string | undefined,
    ids: string[],
    page: number,
    mode: 'following' | 'global'
  ) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('posts')
      .select('id, content, media_url, likes_count, created_at, is_mux_asset, profiles:author_id (id, full_name, role, position, location, avatar_url)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (mode === 'following' && userId && ids.length > 0) {
      query = query.in('author_id', [userId, ...ids]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts');
      return;
    }

    if (data && data.length > 0) {
      const postIds = data.map((p: any) => p.id);

      // ✅ Batch-fetch interaction state for all posts in one query each
      // instead of 2 DB calls per PostCard (20+ calls saved per page load)
      const [{ data: likedData }, { data: savedData }] = await Promise.all([
        userId
          ? supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
          : Promise.resolve({ data: [] }),
        userId
          ? supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const likedSet = new Set(likedData?.map((r: any) => r.post_id) ?? []);
      const savedSet = new Set(savedData?.map((r: any) => r.post_id) ?? []);

      const enriched = data.map((p: any) => ({
        ...p,
        has_liked: likedSet.has(p.id),
        has_saved: savedSet.has(p.id),
      }));

      if (page === 0) {
        setPosts(enriched as unknown as Post[]);
      } else {
        setPosts(prev => [...prev, ...enriched as unknown as Post[]]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } else if (data) {
      if (page === 0) setPosts([]);
      setHasMore(false);
    }
  }, []);

  // ─── Infinite Scroll Observer ────────────────────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setLoadingMore(true);
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        const userId = currentUserProfile?.id;
        await loadPosts(userId, followingIds, nextPage, feedMode);
        setLoadingMore(false);
      }
    }, { threshold: 0.5 });

    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, loadPosts, currentUserProfile, followingIds, feedMode]);

  // ─── Feed Mode Switch ─────────────────────────────────────────────────────
  const switchFeedMode = async (mode: 'following' | 'global') => {
    if (mode === feedMode) return;
    setFeedMode(mode);
    setLoading(true);
    pageRef.current = 0;
    await loadPosts(currentUserProfile?.id, followingIds, 0, mode);
    setLoading(false);
  };

  // ─── Ad Insertion Helper ──────────────────────────────────────────────────
  const getAdForIndex = (index: number): Ad | null => {
    if (ads.length === 0) return null;
    // deterministically pick an ad per slot so it doesn't re-randomize on re-render
    return ads[(index) % ads.length];
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

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20 font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">catchstr</h1>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined text-[26px]">notifications</span>
            {hasUnreadNotifications && (
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background-light dark:ring-background-dark"></span>
            )}
          </Link>
          <Link href="/chat" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined text-[26px] -rotate-45 relative top-[-2px]">send</span>
          </Link>
        </div>
      </header>

      {/* Feed Mode Toggle ✅ */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-[57px] z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
        <button
          onClick={() => switchFeedMode('following')}
          className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${feedMode === 'following' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Following
        </button>
        <button
          onClick={() => switchFeedMode('global')}
          className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${feedMode === 'global' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Discover
        </button>
      </div>

      {/* Stories Rail */}
      <section className="py-4 border-b border-slate-200 dark:border-slate-800/50">
        <div className="flex gap-4 overflow-x-auto px-4 snap-x no-scrollbar">
          {/* Add Story */}
          <div onClick={() => router.push('/create?type=story')} className="snap-center flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer group">
            <div className="relative h-[72px] w-[72px] rounded-full p-[2px] border-2 border-slate-300 dark:border-slate-700 border-dashed">
              <div className="h-full w-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {currentUserProfile?.avatar_url ? (
                  <Image
                    src={currentUserProfile.avatar_url}
                    alt="My Profile Picture"
                    width={72}
                    height={72}
                    className="h-full w-full object-cover opacity-60 rounded-full"
                  />
                ) : (
                  <span className="material-symbols-outlined text-slate-400">person</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="material-symbols-outlined text-white drop-shadow-md">add</span>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-primary h-6 w-6 rounded-full flex items-center justify-center border-2 border-background-light dark:border-background-dark">
                <span className="material-symbols-outlined text-white text-[14px]">add</span>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center truncate w-full">My Story</p>
          </div>

          {/* Active Story Items */}
          {stories.map((story) => (
            <div key={story.id} onClick={() => router.push(`/stories/${story.author_id}`)} className="snap-center flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer">
              <div className="h-[72px] w-[72px] rounded-full p-[2px] bg-gradient-to-tr from-primary via-blue-400 to-pitch-green">
                <div className="h-full w-full rounded-full bg-background-light dark:bg-background-dark p-[2px]">
                  {story.profiles?.avatar_url ? (
                    <Image
                      src={story.profiles.avatar_url}
                      alt={`${story.profiles.full_name} story`}
                      width={72}
                      height={72}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400">person</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs font-medium text-slate-900 dark:text-slate-200 text-center truncate w-full">{story.profiles?.full_name?.split(' ')[0] || 'User'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Feed */}
      <main className="flex flex-col gap-6 pt-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center opacity-60 gap-3">
            <span className="material-symbols-outlined text-4xl">group_add</span>
            {feedMode === 'following' ? (
              <>
                <p className="font-bold">Your feed is empty</p>
                <p className="text-sm text-slate-500">Follow players, agents, and scouts to see their posts here.</p>
                <button onClick={() => switchFeedMode('global')} className="mt-2 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-colors">
                  Explore global feed
                </button>
              </>
            ) : (
              <p>No posts available yet.</p>
            )}
          </div>
        ) : (
          <>
            {posts.map((post, index) => (
              <div key={post.id} className="space-y-6">
                <PostCard
                  post={post}
                  currentUserId={currentUserProfile?.id || null}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                />
                {/* ✅ Inject cached ad every 3 posts, no extra DB call */}
                {(index + 1) % 3 === 0 && getAdForIndex(Math.floor(index / 3)) && (
                  <AdBanner ad={getAdForIndex(Math.floor(index / 3))!} />
                )}
              </div>
            ))}

            {/* ✅ Infinite Scroll Sentinel */}
            <div ref={loaderRef} className="flex justify-center p-4 min-h-[60px]">
              {loadingMore && (
                <div className="w-6 h-6 rounded-full border-3 border-primary border-t-transparent animate-spin"></div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-xs text-slate-400 font-medium">You&apos;re all caught up 🎉</p>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
