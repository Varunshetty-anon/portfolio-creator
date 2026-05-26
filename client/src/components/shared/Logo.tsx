import React from 'react';
import { motion } from 'framer-motion';

export const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div 
        className="relative w-8 h-8 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
      >
        <div className="absolute inset-0 border-2 border-white rounded-[4px] rotate-3 opacity-20 transition-all duration-300" />
        <div className="absolute inset-0 border-2 border-white rounded-[4px] -rotate-3 opacity-40 transition-all duration-300" />
        <div className="absolute inset-0 bg-white rounded-[4px] flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          <span className="font-display font-bold text-black text-lg leading-none tracking-tighter">F</span>
        </div>
      </motion.div>
      <span className="font-display font-bold text-white tracking-[0.2em] text-sm uppercase">
        FRAMES
      </span>
    </div>
  );
};
