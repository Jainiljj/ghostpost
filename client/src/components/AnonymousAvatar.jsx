import React from 'react';

const AnonymousAvatar = ({ color, emoji, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-3xl',
    xxl: 'w-24 h-24 text-5xl',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  // Generate a premium gradient by mixing the base color with a slightly darker variation
  const getGradientStyle = (hex) => {
    if (!hex) return { backgroundColor: '#71717a' };
    
    // Simple hex to rgb conversion to make a darker variant
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const darkVariant = `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`;
    return {
      background: `linear-gradient(135deg, ${hex} 0%, ${darkVariant} 100%)`,
      boxShadow: `0 0 10px ${hex}33`, // 20% opacity glow
    };
  };

  return (
    <div
      style={getGradientStyle(color)}
      className={`${selectedSize} rounded-full flex items-center justify-center select-none font-bold border border-white/10 shrink-0 ${className}`}
    >
      <span className="transform active:scale-110 transition-transform duration-200">
        {emoji || '👻'}
      </span>
    </div>
  );
};

export default AnonymousAvatar;
