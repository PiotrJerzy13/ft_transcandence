import React from 'react';

interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-3xl',
  lg: 'text-5xl',
};

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  maxScore,
  animated = false,
  size = 'md',
}) => {
  return (
    <div
      className={`
        ${sizeClasses[size]} 
        font-bold 
        text-yellow-400 
        ${animated ? 'animate-pulse' : ''}
        tabular-nums
      `}
    >
      {score.toString().padStart(4, '0')}
      {maxScore && (
        <span className="text-gray-400 text-sm ml-2">
          / {maxScore}
        </span>
      )}
    </div>
  );
};

