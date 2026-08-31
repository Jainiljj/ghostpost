import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPostComments, createComment } from '../services/commentService';
import Comment from './Comment';
import CommentInput from './CommentInput';
import { CommentSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';
import { MessageSquarePlus } from 'lucide-react';

const CommentSection = ({ postId, onCountUpdated }) => {
  const { user } = useAuth();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadComments = async () => {
    setError('');
    try {
      const res = await getPostComments(postId);
      setComments(res.data);
      if (onCountUpdated) {
        // Calculate total count (root comments + recursive replies)
        const countTotal = (list) => {
          let count = 0;
          list.forEach(c => {
            count += 1;
            if (c.replies) count += countTotal(c.replies);
          });
          return count;
        };
        onCountUpdated(countTotal(res.data));
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Could not retrieve discussion comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleRootSubmit = async (text) => {
    try {
      await createComment(postId, text);
      loadComments(); // reload list
    } catch (err) {
      console.error('Root comment failed:', err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <h3 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/80 pb-2">
        Discussion Thread
      </h3>

      {/* Root input block */}
      {user ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-4 rounded-2xl">
          <CommentInput
            placeholder="What are your thoughts on this?"
            submitText="Post Comment"
            onSubmit={handleRootSubmit}
          />
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-zinc-950/20 border border-slate-200/50 dark:border-zinc-800 p-4 rounded-2xl text-center text-xs font-semibold text-slate-500">
          Please <a href="/login" className="text-ghost-500 font-bold">log in</a> to join the discussion.
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-xs text-rose-500 font-semibold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          {error}
        </div>
      )}

      {/* List content */}
      {loading ? (
        <div className="space-y-4">
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          message="No comments yet"
          description="Be the first to join the conversation."
          icon={MessageSquarePlus}
        />
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              postId={postId}
              onCommentUpdated={loadComments}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default CommentSection;
