const User = require('../models/User');

const adjectives = [
  'Ghost', 'Silent', 'Hidden', 'Shadow', 'Swift', 'Mystic', 'Stealthy', 'Cunning', 
  'Sneaky', 'Wise', 'Crypto', 'Cosmic', 'Wild', 'Frost', 'Fiery', 'Iron', 
  'Neon', 'Lunar', 'Solar', 'Velvet', 'Golden', 'Silver', 'Static', 'Drifting'
];

const nouns = [
  'Fox', 'Wolf', 'Owl', 'Tiger', 'Bear', 'Raven', 'Falcon', 'Panther', 
  'Rabbit', 'Koala', 'Otter', 'Panda', 'Lynx', 'Badger', 'Coyote', 'Eagle', 
  'Hawk', 'Jaguar', 'Leopard', 'Cheetah', 'Deer', 'Bison', 'Dolphin', 'Octopus'
];

const colors = [
  '#9d4edd', // Ghost purple
  '#3b82f6', // Electric blue
  '#10b981', // Emerald green
  '#ec4899', // Hot pink
  '#f59e0b', // Amber yellow
  '#f97316', // Neon orange
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

const emojis = [
  '👻', '🦊', '🐺', '🦉', '🐯', '🐻', '🦅', '🐨', '🐼', '🦦', 
  '🐰', '🦁', '🐸', '🐙', '🦄', '🦇', '🦈', '🦡', '🐝', '🦎'
];

const generateHandle = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(10 + Math.random() * 90); // 10 to 99
  return `${adj}${noun}${num}`;
};

const generateIdentity = async () => {
  let handle = generateHandle();
  let attempts = 0;
  
  // Make sure it's unique
  while (attempts < 10) {
    const existing = await User.findOne({ anonHandle: handle });
    if (!existing) {
      break;
    }
    handle = generateHandle();
    attempts++;
  }

  // Guaranteed fallback if all 10 random attempts collide (very rare)
  if (attempts >= 10) {
    handle = `Ghost${Date.now().toString(36)}`;
  }

  const avatarColor = colors[Math.floor(Math.random() * colors.length)];
  const avatarEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return {
    anonHandle: handle,
    avatarColor,
    avatarEmoji
  };
};

module.exports = {
  generateIdentity
};
