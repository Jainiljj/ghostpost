import React from 'react';
import { MapPin, Globe } from 'lucide-react';

const LocationBadge = ({ label, hasLocation }) => {
  const isGlobal = label === 'Global' || !hasLocation;

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-100 dark:bg-zinc-800/60 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-zinc-700/50 w-fit select-none">
      {isGlobal ? (
        <>
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>Global</span>
        </>
      ) : (
        <>
          <MapPin className="w-3.5 h-3.5 text-ghost-500 animate-pulse" />
          <span>{label}</span>
        </>
      )}
    </div>
  );
};

export default LocationBadge;
