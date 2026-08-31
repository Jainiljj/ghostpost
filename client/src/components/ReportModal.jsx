import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { createReport } from '../services/reportService';

const reasons = [
  'Spam',
  'Harassment',
  'Hate/abuse',
  'Sexual content',
  'Violence',
  'Misinformation',
  'Illegal content',
  'Other'
];

const ReportModal = ({ isOpen, onClose, targetType, targetId, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createReport({
        targetType,
        targetId,
        reason: selectedReason,
        description
      });
      
      setSelectedReason('');
      setDescription('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. You might have already reported this.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden glass rounded-2xl shadow-glow-strong border border-slate-200/20 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-rose-500 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <span>Report Content</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              Why are you reporting this {targetType}?
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {reasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all duration-200 ${
                    selectedReason === reason
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-400 shadow-sm'
                      : 'border-slate-200/50 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/30 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="sr-only"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Additional Details (Optional)
            </label>
            <textarea
              id="description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context to help moderators review..."
              className="w-full bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/60 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ghost-500 focus:border-ghost-500 transition-all resize-none"
            />
          </div>

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
              type="submit"
              disabled={loading || !selectedReason}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-md shadow-rose-500/20"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReportModal;
