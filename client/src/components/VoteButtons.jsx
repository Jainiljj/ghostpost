import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';

const VoteButtons = ({ score, userVote, onVote, horizontal = false }) => {
  const [localScore, setLocalScore] = useState(score);
  const [localVote, setLocalVote] = useState(userVote);

  // Keep state sync'd with parent changes
  React.useEffect(() => {
    setLocalScore(score);
    setLocalVote(userVote);
  }, [score, userVote]);

  const handleVoteClick = (val) => {
    if (!onVote) return;
    
    // Calculate preview for micro-interaction speed before API returns
    let scoreDiff = 0;
    let newVote = 0;

    if (localVote === val) {
      // Toggle off
      newVote = 0;
      scoreDiff = -val;
    } else {
      // Switch vote or initial vote
      newVote = val;
      scoreDiff = localVote === 0 ? val : val * 2;
    }

    setLocalVote(newVote);
    setLocalScore(prev => prev + scoreDiff);

    // Trigger parent action which fires API call
    onVote(val);
  };

  const getScoreColor = () => {
    if (localVote === 1) return 'text-[#FF4500] font-bold';
    if (localVote === -1) return 'text-[#7193FF] font-bold';
    return 'text-slate-700 dark:text-zinc-300 font-bold';
  };

  return (
    <div className={`flex items-center select-none ${
      horizontal 
        ? 'flex-row gap-1 bg-[#F6F8F9] dark:bg-zinc-850 border border-slate-200/50 dark:border-zinc-800 rounded-full px-1.5 py-0.5' 
        : 'flex-col gap-0.5 w-11 py-2'
    }`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVoteClick(1)}
        type="button"
        aria-label="Upvote"
        className={`p-1 rounded-full transition-colors ${
          localVote === 1
            ? 'text-[#FF4500] bg-[#FF4500]/10'
            : 'text-slate-400 hover:text-[#FF4500] hover:bg-[#FF4500]/10'
        }`}
      >
        <ArrowBigUp className={`w-4 h-4 ${localVote === 1 ? 'fill-[#FF4500]' : ''}`} />
      </button>

      {/* Net Score */}
      <span className={`text-[11px] min-w-[20px] text-center ${getScoreColor()}`}>
        {localScore}
      </span>

      {/* Downvote Button */}
      <button
        onClick={() => handleVoteClick(-1)}
        type="button"
        aria-label="Downvote"
        className={`p-1 rounded-full transition-colors ${
          localVote === -1
            ? 'text-[#7193FF] bg-[#7193FF]/10'
            : 'text-slate-400 hover:text-[#7193FF] hover:bg-[#7193FF]/10'
        }`}
      >
        <ArrowBigDown className={`w-4 h-4 ${localVote === -1 ? 'fill-[#7193FF]' : ''}`} />
      </button>
    </div>
  );
};

export default VoteButtons;
