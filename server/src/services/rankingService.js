// Calculate Reddit-style Hot score
// balancing vote counts and creation time decay
const calculateHotScore = (upvotes, downvotes, createdAt) => {
  const score = upvotes - downvotes;
  
  // Logarithmic scale for score
  const order = Math.log10(Math.max(1, Math.abs(score)));
  
  // Sign of score
  let sign = 0;
  if (score > 0) sign = 1;
  if (score < 0) sign = -1;
  
  // Epoch baseline (Jan 1, 2026)
  const epoch = new Date('2026-01-01T00:00:00Z').getTime() / 1000;
  const postSeconds = new Date(createdAt).getTime() / 1000;
  const seconds = postSeconds - epoch;
  
  // 45000 seconds is 12.5 hours (Reddit factor)
  const hotScore = order + (sign * seconds) / 45000;
  
  return Number(hotScore.toFixed(7));
};

module.exports = {
  calculateHotScore
};
