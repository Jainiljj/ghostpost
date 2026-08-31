import React from 'react';

const tagStyles = {
  Confession: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  Event: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Question: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  Rant: 'bg-red-500/10 text-red-400 border border-red-500/20',
  Discussion: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  News: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Help: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  Meme: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Other: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

const FlairBadge = ({ tag, onClick }) => {
  const style = tagStyles[tag] || tagStyles.Other;

  return (
    <span
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${style} ${
        onClick ? 'cursor-pointer hover:bg-opacity-20 active:scale-95 transition-all' : ''
      }`}
    >
      {tag}
    </span>
  );
};

export default FlairBadge;
