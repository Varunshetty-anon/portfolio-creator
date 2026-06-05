import React from 'react';
import { motion } from 'framer-motion';

export const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div 
        className="relative w-6 h-6 flex items-center justify-center text-text-primary"
        whileHover={{ scale: 1.05, rotate: 90 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M2 10V2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
          <path d="M18 2H26V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
          <path d="M26 18V26H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
          <path d="M10 26H2V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
        </svg>
      </motion.div>
      <span className="font-display font-bold tracking-[0.18em] text-text-primary uppercase mt-0.5" style={{ fontSize: 16 * 0.65 }}>
        FRAMES
      </span>
    </div>
  );
};
