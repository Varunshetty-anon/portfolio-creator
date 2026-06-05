import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "", 
  size = 28,
  showWordmark = true 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Precision Viewfinder Mark */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 28 28" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-text-primary"
      >
        {/* Top Left */}
        <path d="M2 10V2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
        {/* Top Right */}
        <path d="M18 2H26V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
        {/* Bottom Right */}
        <path d="M26 18V26H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
        {/* Bottom Left */}
        <path d="M10 26H2V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
      </svg>
      
      {/* Brand Text */}
      {showWordmark && (
        <span className="font-display font-bold tracking-[0.18em] text-text-primary uppercase translate-y-[1px]" style={{ fontSize: size * 0.65 }}>
          FRAMES
        </span>
      )}
    </div>
  );
};
