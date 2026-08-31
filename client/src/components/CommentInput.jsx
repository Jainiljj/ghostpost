import React, { useState } from 'react';

const CommentInput = ({ onSubmit, placeholder = 'Write a reply...', submitText = 'Reply', onCancel }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const text = content.trim();
    if (!text) return;
    
    if (text.length > 500) {
      setError('Comments must be under 500 characters.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(text);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 text-left">
      <div className="relative">
        <textarea
          rows="2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength="500"
          className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ghost-500 focus:border-ghost-500 transition-all resize-none"
          required
        />
        <div className="absolute right-3.5 bottom-3.5 text-[9px] font-bold text-slate-400 select-none">
          {content.length}/500
        </div>
      </div>

      {error && (
        <div className="text-[10px] text-rose-500 font-semibold pl-1">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 border border-slate-200 dark:border-zinc-850 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all select-none"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-1.5 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-[10px] font-bold shadow-md shadow-ghost-500/20 active:scale-95 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : submitText}
        </button>
      </div>
    </form>
  );
};

export default CommentInput;
