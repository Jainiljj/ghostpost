import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ message = 'Something went quiet.', description, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-red-100 dark:border-rose-950/20 rounded-3xl bg-red-50/10 dark:bg-rose-950/5 py-12 animate-in fade-in duration-300">
      <div className="w-12 h-12 rounded-full bg-rose-100/50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mb-4 border border-rose-100 dark:border-rose-950/30">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
        {message}
      </h3>

      {description && (
        <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mt-1 mb-4 font-medium">
          {description}
        </p>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold select-none transition-all duration-200 active:scale-95 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
