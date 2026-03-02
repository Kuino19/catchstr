'use client';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import AdBanner from '@/components/AdBanner';

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

export default function FeedPage() {
  const router = useRouter();
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    async function loadFeedData() {
      // 1. Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch current user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) setCurrentUserProfile(profile as Profile);
      }

      // 2. Fetch posts with author profiles
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }

      if (postsData) {
        setPosts(postsData as unknown as Post[]);
      }

      // 3. Check for unread notifications
      if (session?.user) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_read', false);

        setHasUnreadNotifications(!!(count && count > 0));
      }

      // 4. Fetch Active Stories (within last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: storiesData } = await supabase
        .from('stories')
        .select(`*, profiles:author_id (*)`)
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

      setLoading(false);
    }

    loadFeedData();
  }, []);

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

      {/* Stories Rail */}
      <section className="py-4 border-b border-slate-200 dark:border-slate-800/50">
        <div className="flex gap-4 overflow-x-auto px-4 snap-x no-scrollbar">
          {/* Add Story */}
          <div onClick={() => router.push('/create?type=story')} className="snap-center flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer group">
            <div className="relative h-[72px] w-[72px] rounded-full p-[2px] border-2 border-slate-300 dark:border-slate-700 border-dashed">
              <div className="h-full w-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {currentUserProfile?.avatar_url ? (
                  <img alt="My Profile Picture" className="h-full w-full object-cover opacity-60" src={currentUserProfile.avatar_url} />
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
                    <img alt={`${story.profiles.full_name} profile`} className="h-full w-full rounded-full object-cover" src={story.profiles.avatar_url} />
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
          <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
            <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
            <p>No posts available yet. Create one!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <div key={post.id} className="space-y-6">
              <PostCard
                post={post}
                currentUserId={currentUserProfile?.id || null}
              />
              {/* Inject Ad after every 3 posts */}
              {(index + 1) % 3 === 0 && <AdBanner />}
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
