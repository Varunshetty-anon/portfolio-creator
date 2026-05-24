import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Cinematic Frame Icon */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Outer Frame (thin) */}
        <div className="absolute inset-0 border border-frames-text opacity-80" />
        {/* Inner Frame (offset, thick) */}
        <div className="absolute inset-[4px] border-2 border-frames-text opacity-40" />
        {/* Accent / Trim Mark */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-frames-text" />
      </div>
      
      {/* Brand Text */}
      <span className="font-display font-bold tracking-widest text-lg">
        FRAMES
      </span>
    </div>
  );
};
