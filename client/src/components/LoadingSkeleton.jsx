import React from 'react';

export const PostSkeleton = () => {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl p-4 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded-full w-24" />
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-16" />
        </div>
        <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded-full w-14" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded-full w-full" />
        <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded-full w-11/12" />
        <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded-full w-3/4" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800" />
          <div className="w-6 h-4 bg-slate-200 dark:bg-zinc-800 rounded-md" />
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-16" />
        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-16" />
      </div>
    </div>
  );
};

export const CommentSkeleton = () => {
  return (
    <div className="flex gap-3 animate-pulse py-2">
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-20" />
          <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full w-12" />
        </div>
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-full" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-3/4" />
      </div>
    </div>
  );
};

export const FeedSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
};
