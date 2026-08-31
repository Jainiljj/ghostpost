import React, { useState, useEffect } from 'react';
import { getGlobalPosts, getFollowingPosts } from '../services/postService';
import PostCard from '../components/PostCard';
import { FeedSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Clock, TrendingUp, Compass, Users } from 'lucide-react';

const GlobalFeed = () => {
  const { user } = useAuth();
  const [feedTab, setFeedTab] = useState('forYou'); // forYou | following
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('hot');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const loadFeed = async (initial = false, nextCursor = '') => {
    if (initial) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      let res;
      if (feedTab === 'following' && user) {
        res = await getFollowingPosts(10, nextCursor);
      } else {
        res = await getGlobalPosts(sort, 10, nextCursor);
      }

      const newPosts = res.data.posts;

      if (initial) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setCursor(res.data.nextCursor || '');
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error('Failed to load feed:', err);
      setError('Something went wrong. Could not fetch posts.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(true);
  }, [sort, feedTab]);

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  const sortTabs = [
    { type: 'hot', label: 'Trending', icon: Sparkles },
    { type: 'new', label: 'Newest', icon: Clock },
    { type: 'top', label: 'Top Voted', icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      {/* Feed Tabs: For You / Following */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => setFeedTab('forYou')}
          type="button"
          className={`flex-1 py-3 text-xs font-bold transition-all ${
            feedTab === 'forYou'
              ? 'text-slate-900 dark:text-white border-b-2 border-ghost-500'
              : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
          }`}
        >
          For You
        </button>
        {user && (
          <button
            onClick={() => setFeedTab('following')}
            type="button"
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              feedTab === 'following'
                ? 'text-slate-900 dark:text-white border-b-2 border-ghost-500'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Following
          </button>
        )}
      </div>

      {/* Sort tabs (only on For You) */}
      {feedTab === 'forYou' && (
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/60 p-1 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl w-full sm:w-fit select-none">
          {sortTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.type}
                onClick={() => setSort(tab.type)}
                type="button"
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  sort === tab.type
                    ? 'bg-white dark:bg-zinc-800 text-ghost-500 dark:text-ghost-400 shadow-sm border border-slate-200/30 dark:border-zinc-700/30'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={() => loadFeed(true)} />}

      {/* Posts List */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          message={feedTab === 'following' ? 'Nothing from people you follow' : 'No posts yet'}
          description={
            feedTab === 'following'
              ? 'Follow some users to see their posts here.'
              : 'Be the first to start the conversation!'
          }
          icon={feedTab === 'following' ? Users : Compass}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onPostDeleted={handlePostDeleted} />
          ))}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => loadFeed(false, cursor)}
                disabled={loadingMore}
                type="button"
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-800 rounded-2xl text-xs font-bold select-none transition-all active:scale-95 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalFeed;
