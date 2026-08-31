import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostDetail } from '../services/postService';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import { PostSkeleton } from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPostDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPostDetail(id);
      setPost(res.data);
    } catch (err) {
      console.error('Failed to load post detail:', err);
      if (err.response?.status === 404) {
        setError('Post not found or was removed by moderators.');
      } else {
        setError('Failed to retrieve post details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostDetail();
  }, [id]);

  const handlePostDeleted = () => {
    navigate('/');
  };

  const handleCommentCountUpdate = (newCount) => {
    setPost((prev) => (prev ? { ...prev, commentCount: newCount } : null));
  };

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <div className="text-left">
        <button
          onClick={() => navigate(-1)}
          type="button"
          className="text-xs font-bold text-slate-500 hover:text-ghost-500 dark:hover:text-ghost-400 select-none transition-colors"
        >
          ← Back to Feed
        </button>
      </div>

      {loading ? (
        <PostSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPostDetail} />
      ) : (
        <div className="space-y-6">
          <PostCard post={post} onPostDeleted={handlePostDeleted} />
          
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl p-5">
            <CommentSection postId={post._id} onCountUpdated={handleCommentCountUpdate} />
          </div>
        </div>
      )}

    </div>
  );
};

export default PostDetail;
