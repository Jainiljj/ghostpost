import React from 'react';

const RadiusSelector = ({ selectedRadius, onChange, className = '' }) => {
  const options = [1, 5, 10, 25];

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
        Search Radius
      </span>
      <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-700/50 w-fit">
        {options.map((rad) => (
          <button
            key={rad}
            type="button"
            onClick={() => onChange(rad)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
              selectedRadius === rad
                ? 'bg-ghost-500 text-white shadow-glow glow-primary'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            {rad} km
          </button>
        ))}
      </div>
    </div>
  );
};

export default RadiusSelector;
