import React from 'react';

interface RankBadgeProps {
  rank: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const rankColors: Record<string, string> = {
  bronze: 'bg-orange-900 text-orange-200',
  silver: 'bg-gray-400 text-gray-900',
  gold: 'bg-yellow-500 text-yellow-900',
  platinum: 'bg-blue-400 text-blue-900',
  diamond: 'bg-cyan-400 text-cyan-900',
  master: 'bg-purple-600 text-purple-100',
  legend: 'bg-red-600 text-red-100',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const RankBadge: React.FC<RankBadgeProps> = ({ 
  rank, 
  size = 'md', 
  animated = false 
}) => {
  const baseClasses = `${rankColors[rank.toLowerCase()] || rankColors.bronze} ${sizeClasses[size]} rounded-full font-bold`;
  const animationClass = animated ? 'animate-pulse' : '';

  return (
    <span className={`${baseClasses} ${animationClass}`}>
      {rank.toUpperCase()}
    </span>
  );
};

