import React from 'react';
import { HelpCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmText = 'Confirm', type = 'danger' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white',
    primary: 'bg-ghost-500 hover:bg-ghost-600 shadow-ghost-500/20 text-white',
  };

  const btnStyle = typeStyles[type] || typeStyles.primary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden glass rounded-2xl shadow-glow-strong border border-slate-200/20 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 font-semibold text-sm">
            <HelpCircle className="w-5 h-5 text-ghost-500" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-slate-800 dark:hover:text-zinc-200 transition-all select-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all select-none shadow-md ${btnStyle}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
