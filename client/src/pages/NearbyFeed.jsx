import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeolocation } from '../context/GeolocationContext';
import { getNearbyPosts } from '../services/postService';
import PostCard from '../components/PostCard';
import RadiusSelector from '../components/RadiusSelector';
import { FeedSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { MapPin, AlertCircle, MapPinOff, Globe } from 'lucide-react';

const NearbyFeed = () => {
  const { coords, radius, setRadius, permissionStatus, requestLocation } = useGeolocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [requestingGPS, setRequestingGPS] = useState(false);

  const loadNearby = async (initial = false, pageNum = 1) => {
    if (!coords) return;

    if (initial) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await getNearbyPosts(coords.latitude, coords.longitude, radius, pageNum, 10);
      const newPosts = res.data.posts;
      
      if (initial) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      
      setHasMore(res.data.hasMore);
      setPage(res.data.page);
    } catch (err) {
      console.error('Failed to load nearby posts:', err);
      setError('Failed to fetch nearby discussions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger load when coordinates or radius changes
  useEffect(() => {
    if (coords) {
      loadNearby(true, 1);
    }
  }, [coords, radius]);

  const handleAllowClick = async () => {
    setRequestingGPS(true);
    setError('');
    try {
      await requestLocation();
    } catch (err) {
      console.error('Location permission request rejected:', err);
    } finally {
      setRequestingGPS(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  // 1. Geolocation unsupported/denied state
  if (permissionStatus === 'denied') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col text-left space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
            Nearby Feed
          </h2>
        </div>
        <EmptyState
          message="Location Access Blocked"
          description="Nearby discussions require location permissions. Please check your browser's site settings to grant location access, or switch back to the Global feed."
          icon={MapPinOff}
          actionText="Go to Global Feed"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  // 2. Geolocation prompt state (explanation view)
  if (permissionStatus === 'prompt' && !coords) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col text-left space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
            Nearby Feed
          </h2>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-6 text-center flex flex-col items-center py-12 space-y-4">
          <div className="w-14 h-14 rounded-full bg-ghost-500/10 text-ghost-500 flex items-center justify-center border border-ghost-500/20 shadow-glow">
            <MapPin className="w-6 h-6 fill-ghost-500/10" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">
              Find Conversations Around You
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
              Nearby discussions use your browser's location to scan for posts. Your exact location is masked dynamically and never shown to other users.
            </p>
          </div>
          
          <div className="flex items-center gap-3 pt-2 w-full max-w-xs">
            <button
              onClick={() => navigate('/')}
              type="button"
              className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-slate-800 dark:hover:text-zinc-200 select-none transition-all"
            >
              Maybe Later
            </button>
            <button
              onClick={handleAllowClick}
              disabled={requestingGPS}
              type="button"
              className="flex-1 py-2 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-xs font-bold shadow-md shadow-ghost-500/20 select-none transition-all active:scale-95 disabled:opacity-50"
            >
              {requestingGPS ? 'Loading...' : 'Allow Location'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col text-left space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
            Nearby Feed
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
            What’s happening around you right now?
          </p>
        </div>
        
        {/* Radius Selector */}
        {coords && <RadiusSelector selectedRadius={radius} onChange={setRadius} />}
      </div>

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={() => loadNearby(true, 1)} />}

      {/* Feed List */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          message="No whispers nearby yet"
          description="It's quiet in this circle. Create a post with your location attached to start the conversation!"
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
                onClick={() => loadNearby(false, page + 1)}
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

export default NearbyFeed;
