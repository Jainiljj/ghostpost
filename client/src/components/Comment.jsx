import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createComment, deleteComment, voteComment } from '../services/commentService';
import ProfileAvatar from './ProfileAvatar';
import CommentInput from './CommentInput';
import ReportModal from './ReportModal';
import ConfirmModal from './ConfirmModal';
import { timeAgo } from '../utils/timeAgo';
import { MessageSquare, ArrowBigUp, AlertOctagon, Trash2 } from 'lucide-react';

const Comment = ({ comment, postId, onCommentUpdated }) => {
  const { user } = useAuth();

  const [score, setScore] = useState(comment.score);
  const [hasVoted, setHasVoted] = useState(false);
  const [replying, setReplying] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const author = comment.author || {};
  const isDeleted = comment.isDeleted || author.username === '[deleted]';

  const handleVote = async () => {
    if (!user) return;
    try {
      const voteVal = hasVoted ? -1 : 1;
      await voteComment(comment._id, voteVal);
      setScore((prev) => prev + voteVal);
      setHasVoted(!hasVoted);
    } catch (err) {
      console.error('Comment vote failed:', err);
    }
  };

  const handleReplySubmit = async (text) => {
    try {
      await createComment(postId, text, comment._id);
      setReplying(false);
      if (onCommentUpdated) onCommentUpdated();
    } catch (err) {
      console.error('Reply failed:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(comment._id);
      if (onCommentUpdated) onCommentUpdated();
    } catch (err) {
      console.error('Comment delete failed:', err);
    }
  };

  const isAuthor = user && author._id && user._id === author._id.toString();
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="flex flex-col gap-2 animate-in fade-in duration-200">

      {/* Comment Header and Content */}
      <div className="flex items-start gap-2.5">
        <Link to={!isDeleted ? `/profile/${author.username}` : '#'}>
          <ProfileAvatar user={isDeleted ? { username: '[deleted]' } : author} size="sm" className="mt-0.5" />
        </Link>

        <div className="flex-1 space-y-1 text-left">
          {/* Metadata */}
          <div className="flex items-center gap-2">
            <Link
              to={!isDeleted ? `/profile/${author.username}` : '#'}
              className={`text-[11px] font-bold ${isDeleted ? 'text-slate-400 dark:text-zinc-500 cursor-default' : 'text-slate-700 dark:text-zinc-300 hover:underline'}`}
            >
              {isDeleted ? '[deleted]' : (author.displayName || `@${author.username}`)}
            </Link>
            {!isDeleted && (
              <span className="text-[9px] text-slate-400 dark:text-zinc-550">
                @{author.username}
              </span>
            )}
            <span className="text-[9px] text-slate-400 dark:text-zinc-550">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Body */}
          <p className={`text-xs leading-relaxed break-words font-medium ${
            isDeleted ? 'text-slate-400 dark:text-zinc-500 italic' : 'text-slate-600 dark:text-zinc-300'
          }`}>
            {comment.content}
          </p>

          {/* Action Row */}
          {!isDeleted && (
            <div className="flex items-center gap-3 pt-1 text-[10px] font-bold text-slate-400 select-none">

              {/* Upvote */}
              <button
                onClick={handleVote}
                type="button"
                className={`flex items-center gap-1 transition-colors ${
                  hasVoted ? 'text-[#FF4500]' : 'hover:text-[#FF4500]'
                }`}
              >
                <ArrowBigUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-[#FF4500] text-[#FF4500]' : ''}`} />
                <span>{score}</span>
              </button>

              {/* Reply */}
              {user && (
                <button
                  onClick={() => setReplying(!replying)}
                  type="button"
                  className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              )}

              {/* Report */}
              {user && !isAuthor && (
                <button
                  onClick={() => setReportOpen(true)}
                  type="button"
                  className="flex items-center gap-1 hover:text-rose-500 dark:hover:text-rose-400"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              )}

              {/* Delete */}
              {(isAuthor || isAdmin) && (
                <button
                  onClick={() => setDeleteOpen(true)}
                  type="button"
                  className="flex items-center gap-1 hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply input */}
      {replying && (
        <div className="pl-10 mt-1">
          <CommentInput
            placeholder={`Reply to @${author.username}...`}
            submitText="Send Reply"
            onSubmit={handleReplySubmit}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}

      {/* Recursive Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-4 border-l-2 border-slate-200 dark:border-zinc-800/80 mt-1 space-y-4 hover:border-slate-350 dark:hover:border-zinc-700 transition-colors">
          {comment.replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              postId={postId}
              onCommentUpdated={onCommentUpdated}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="comment"
        targetId={comment._id}
        onSuccess={() => setReportOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure? If this comment has replies, its text will be cleared but structure will remain."
        confirmText="Delete"
        type="danger"
      />

    </div>
  );
};

export default Comment;
