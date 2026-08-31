import React from 'react';

// Deterministic color from username string
const getAvatarColor = (str = '') => {
  const colors = [
    '#FF4500', '#FF6314', '#FF8C00', '#E8A838',
    '#22C55E', '#10B981', '#06B6D4', '#3B82F6',
    '#8B5CF6', '#EC4899', '#F43F5E', '#6366F1',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const sizeMap = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-3xl',
};

const ProfileAvatar = ({ user, size = 'md', className = '' }) => {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const username = user?.username || '';
  const displayName = user?.displayName || username;
  const initials = displayName.slice(0, 2).toUpperCase() || '?';
  const bgColor = getAvatarColor(username);

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`@${username}`}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2 border-white/10 ${className}`}
        onError={(e) => {
          // Fallback to initials on image load failure
          e.target.style.display = 'none';
          e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold select-none ${className}`}
      style={{ backgroundColor: bgColor, color: '#fff' }}
      title={`@${username}`}
    >
      {initials}
    </div>
  );
};

export default ProfileAvatar;
