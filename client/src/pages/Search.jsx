import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchPosts } from '../services/postService';
import PostCard from '../components/PostCard';
import FlairBadge from '../components/FlairBadge';
import { FeedSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { Search as SearchIcon, SlidersHorizontal, MessageSquareX } from 'lucide-react';

const tagsList = ['All', 'Confession', 'Event', 'Question', 'Rant', 'Discussion', 'News', 'Help', 'Meme', 'Other'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'top', label: 'Most Upvoted' },
  { value: 'discussed', label: 'Most Discussed' },
];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTag = searchParams.get('tag') || 'All';

  const [q, setQ] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [sort, setSort] = useState('newest');
  
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const performSearch = async (initial = false, pageNum = 1) => {
    if (initial) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      // Clean query parameter if empty
      const cleanQ = q.trim();
      const res = await searchPosts(cleanQ, tag, sort, pageNum, 10);
      const newPosts = res.data.posts;

      if (initial) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(res.data.hasMore);
      setPage(res.data.page);
      
      // Update URL parameters
      const params = {};
      if (cleanQ) params.q = cleanQ;
      if (tag !== 'All') params.tag = tag;
      setSearchParams(params);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search operations failed. Try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(true, 1);
    }, 400); // 400ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [q, tag, sort]);

  // Keep state in sync with URL changes (e.g. from navbar search or click tag badge)
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    const tagParam = searchParams.get('tag') || 'All';
    
    if (queryParam !== q) setQ(queryParam);
    if (tagParam !== tag) setTag(tagParam);
  }, [searchParams]);

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col space-y-1">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
          Search Board
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Find whispers and filter by flair categories.
        </p>
      </div>

      {/* Inputs block */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
        
        {/* Search Bar Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Type search terms (e.g. college, rain)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ghost-500"
          />
          <SearchIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Category Pills list */}
        <div className="space-y-1.5 select-none">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Category Filter
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tagsList.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                type="button"
                className={`text-[10px] px-3 py-1 rounded-xl font-bold transition-all ${
                  tag === t
                    ? 'bg-ghost-500 text-white shadow-glow'
                    : 'bg-slate-50 dark:bg-zinc-950/30 text-slate-500 border border-slate-250/20 dark:border-zinc-850 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sort & Pagination settings */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Sort By:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 select-none">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                type="button"
                className={`text-[10px] px-3 py-1 rounded-lg font-bold transition-all border ${
                  sort === opt.value
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-950 border-zinc-800 dark:border-zinc-200'
                    : 'bg-transparent text-slate-500 border-slate-250/40 dark:border-zinc-850 hover:text-slate-700 hover:border-slate-350'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Error state */}
      {error && <ErrorState message={error} />}

      {/* Search results list */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          message="No posts matched your search"
          description="Try typing general words, choosing different category pills, or clearing filters."
          icon={MessageSquareX}
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
                onClick={() => performSearch(false, page + 1)}
                disabled={loadingMore}
                type="button"
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-800 rounded-2xl text-xs font-bold select-none transition-all active:scale-95 disabled:opacity-50"
              >
                {loadingMore ? 'Searching...' : 'Load More Search Results'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
