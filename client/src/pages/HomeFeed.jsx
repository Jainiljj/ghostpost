import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomePosts } from '../services/postService';
import PostCard from '../components/PostCard';
import RadiusSelector from '../components/RadiusSelector';
import { FeedSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { Home, Compass, MapPin } from 'lucide-react';

const HomeFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [radius, setRadius] = useState(10); // default 10km
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadHomePosts = async (initial = false, pageNum = 1) => {
    if (!user?.homeLocation?.coordinates) return;

    if (initial) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await getHomePosts(radius, pageNum, 10);
      const newPosts = res.data.posts;

      if (initial) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(res.data.hasMore);
      setPage(res.data.page);
    } catch (err) {
      console.error('Failed to load Home feed:', err);
      // Check if server explicitly returned error code USER_HOME_NOT_SET
      if (err.response?.data?.code === 'USER_HOME_NOT_SET') {
        setError('Home location is not set.');
      } else {
        setError('Failed to retrieve Home circle posts.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.homeLocation?.coordinates) {
      loadHomePosts(true, 1);
    }
  }, [user?.homeLocation, radius]);

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  // If no saved home coordinates
  if (!user?.homeLocation?.coordinates) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col text-left space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
            Home Feed
          </h2>
        </div>
        <EmptyState
          message="Home Circle is Unconfigured"
          description="Your Home circle feed tracks discussions around a permanent location (e.g. hometown, campus) saved by you. Select settings to define your Home."
          icon={Home}
          actionText="Configure Home Location"
          onAction={() => navigate('/settings')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col text-left space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
            Home Feed
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
            What’s happening back home?
          </p>
        </div>

        {/* Radius selector */}
        <RadiusSelector selectedRadius={radius} onChange={setRadius} />
      </div>

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={() => loadHomePosts(true, 1)} />}

      {/* Feed List */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          message="Your Home circle is quiet"
          description="We couldn't find any discussions within this range. Increase the radius, or invite other local ghosts to post!"
          icon={MapPin}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onPostDeleted={handlePostDeleted} />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => loadHomePosts(false, page + 1)}
                disabled={loadingMore}
                type="button"
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-800 rounded-2xl text-xs font-bold select-none transition-all active:scale-95 disabled:opacity-50"
              >
                {loadingMore ? 'Loading Discussions...' : 'Load More Posts'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
