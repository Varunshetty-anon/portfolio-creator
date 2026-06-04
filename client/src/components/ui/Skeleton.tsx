import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '100%',
  borderRadius = 'var(--radius-md)',
  className = '',
}) => {
  return (
    <div
      className={`animate-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-bg-raised) 25%, var(--color-bg-floating) 50%, var(--color-bg-raised) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
};
