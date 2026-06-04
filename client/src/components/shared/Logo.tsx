import React from 'react';
import { motion } from 'framer-motion';

export const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div 
        className="relative w-6 h-6 flex items-center justify-center text-white"
        whileHover={{ scale: 1.05, rotate: 90 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M3 3H10.5V10.5H3V3Z" fill="currentColor" />
          <path d="M13.5 3H21V10.5H13.5V3Z" fill="currentColor" fillOpacity="0.3" />
          <path d="M3 13.5H10.5V21H3V13.5Z" fill="currentColor" fillOpacity="0.3" />
          <path d="M13.5 13.5H21V21H13.5V13.5Z" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </motion.div>
      <span className="font-display font-semibold text-white tracking-[0.25em] text-[13px] uppercase mt-0.5">
        FRAMES
      </span>
    </div>
  );
};
