import React from 'react';
import { HelpCircle } from 'lucide-react';

const EmptyState = ({ message = 'Nothing to see here', description, icon: Icon = HelpCircle, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-slate-50/50 dark:bg-zinc-950/20 py-16 animate-in fade-in duration-300">
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4 border border-slate-200/50 dark:border-zinc-800">
        <Icon className="w-6 h-6" />
      </div>
      
      <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
        {message}
      </h3>
      
      {description && (
        <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mt-1 mb-4 font-medium">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="mt-2 px-4 py-2 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-ghost-500/20 select-none transition-all duration-200 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
