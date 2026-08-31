import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { votePost, removePostVote, deletePost } from '../services/postService';
import { bookmarkPost, unbookmarkPost } from '../services/userService';
import ProfileAvatar from './ProfileAvatar';
import FlairBadge from './FlairBadge';
import LocationBadge from './LocationBadge';
import VoteButtons from './VoteButtons';
import ReportModal from './ReportModal';
import ConfirmModal from './ConfirmModal';
import { MessageSquare, Share2, AlertOctagon, Trash2, Check, Bookmark, Repeat2 } from 'lucide-react';
import { timeAgo } from '../utils/timeAgo';

const PostCard = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [score, setScore] = useState(post.score);
  const [userVote, setUserVote] = useState(post.userVote || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const author = post.author || {};

  const handleVote = async (value) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (userVote === value) {
        await removePostVote(post._id);
        setUserVote(0);
        setScore((prev) => prev - value);
      } else {
        await votePost(post._id, value);
        const scoreDiff = userVote === 0 ? value : value * 2;
        setUserVote(value);
        setScore((prev) => prev + scoreDiff);
      }
    } catch (err) {
      console.error('Voting failed:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post._id);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await unbookmarkPost(post._id);
        setIsBookmarked(false);
      } else {
        await bookmarkPost(post._id);
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Bookmark failed:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleFlairClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/search?tag=${encodeURIComponent(post.tag)}`);
  };

  const isAuthor = user && author._id && user._id === author._id.toString();
  const isAdmin = user && user.role === 'admin';

  return (
    <article className="bg-white dark:bg-zinc-900 border border-slate-250/80 dark:border-zinc-850 rounded-lg hover:border-slate-350 dark:hover:border-zinc-700 transition-all flex flex-row gap-0 relative overflow-hidden animate-in fade-in duration-200">

      {/* Left Vote Strip (Desktop only) */}
      <div className="hidden md:flex flex-col items-center bg-[#F8F9FA] dark:bg-zinc-900/40 w-11 shrink-0 pt-3">
        <VoteButtons score={score} userVote={userVote} onVote={handleVote} horizontal={false} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 flex flex-col gap-3">

        {/* Repost indicator */}
        {post.repostOf && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 font-semibold -mb-1">
            <Repeat2 className="w-3.5 h-3.5" />
            <span>@{author.username} reposted</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2">
          <Link to={`/profile/${author.username}`} onClick={(e) => e.stopPropagation()}>
            <ProfileAvatar user={author} size="xs" />
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-left min-w-0">
            <Link
              to={`/profile/${author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[#1C1C1C] dark:text-zinc-200 hover:underline truncate"
            >
              {author.displayName || author.username}
            </Link>
            <span className="text-slate-400 dark:text-zinc-550 font-normal shrink-0">
              @{author.username}
            </span>
            <span className="text-slate-400 dark:text-zinc-550">·</span>
            <span className="text-slate-400 dark:text-zinc-550 shrink-0">
              {timeAgo(post.createdAt)}
            </span>
          </div>

          {/* Tag + Delete */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <FlairBadge tag={post.tag} onClick={handleFlairClick} />
            {(isAuthor || isAdmin) && (
              <button
                onClick={(e) => { e.preventDefault(); setDeleteModalOpen(true); }}
                type="button"
                className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Post content (or quoted original) */}
        <Link to={`/post/${post._id}`} className="space-y-2 block text-left">

          {/* Quote Post Preview */}
          {post.repostOf && typeof post.repostOf === 'object' && (
            <div className="border border-slate-200 dark:border-zinc-700 rounded-lg p-3 bg-slate-50 dark:bg-zinc-800/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                @{post.repostOf.author?.username}
              </span>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed line-clamp-3">
                {post.repostOf.content}
              </p>
            </div>
          )}

          {post.content && (
            <p className="text-sm text-slate-800 dark:text-zinc-100 leading-relaxed break-words font-medium whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {post.imageUrl && (
            <div className="w-full max-h-96 overflow-hidden rounded-md border border-slate-200/50 dark:border-zinc-800">
              <img
                src={post.imageUrl}
                alt="Post attachment"
                className="w-full h-full object-cover select-none"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </Link>

        {/* Footer controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/40">

          {/* Voting (Mobile only) */}
          <div className="md:hidden mr-1">
            <VoteButtons score={score} userVote={userVote} onVote={handleVote} horizontal={true} />
          </div>

          {/* Comment count */}
          <Link
            to={`/post/${post._id}`}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-850 px-2 py-1 rounded font-bold transition-colors select-none"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>{post.commentCount}</span>
          </Link>

          {/* Repost count */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); if (!user) navigate('/login'); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-850 px-2 py-1 rounded font-bold transition-colors select-none"
          >
            <Repeat2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{post.repostCount || 0}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            type="button"
            disabled={bookmarkLoading}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded font-bold transition-colors select-none ${
              isBookmarked
                ? 'text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            type="button"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-850 px-2 py-1 rounded font-bold transition-colors select-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Report */}
          {!isAuthor && (
            <button
              onClick={() => setReportModalOpen(true)}
              type="button"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-850 px-2 py-1 rounded font-bold transition-colors select-none"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
              <span>Report</span>
            </button>
          )}

          {/* Distance label */}
          <div className="ml-auto">
            <LocationBadge label={post.distanceLabel} hasLocation={post.hasLocation} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="post"
        targetId={post._id}
        onSuccess={() => setReportModalOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to permanently delete this post? This cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </article>
  );
};

export default PostCard;
