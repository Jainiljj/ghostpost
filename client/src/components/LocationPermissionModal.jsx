import React from 'react';
import { MapPin, Shield, X, Navigation } from 'lucide-react';

const LocationPermissionModal = ({ isOpen, onClose, onAllow, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden glass rounded-2xl shadow-glow-strong border border-slate-200/20 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <div className="flex justify-end -mr-2 -mt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-ghost-500/10 text-ghost-500 flex items-center justify-center border border-ghost-500/20 shadow-glow animate-bounce">
            <MapPin className="w-8 h-8 fill-ghost-500/10" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-zinc-150">
            Find Nearby Discussions
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium max-w-[260px] leading-relaxed">
            Nearby discussions use your current location to find conversations around you.
          </p>
        </div>

        {/* Features Info list */}
        <div className="bg-slate-50 dark:bg-zinc-950/40 rounded-xl p-3.5 border border-slate-100 dark:border-zinc-850 space-y-3">
          <div className="flex gap-2.5">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Privacy First</h4>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                Your exact coordinates are never shown to other users or logged.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Navigation className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Dynamic Range</h4>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                Filter conversations within a custom range (1 km to 25 km).
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onAllow}
            disabled={loading}
            className="w-full py-2.5 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-xs font-bold shadow-md shadow-ghost-500/20 active:scale-95 transition-all select-none disabled:opacity-50"
          >
            {loading ? 'Requesting Permission...' : 'Allow Location'}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-slate-800 dark:hover:text-zinc-200 transition-all select-none"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
