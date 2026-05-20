// ========================
// Loading Screen
// ========================

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="h-screen bg-frames-bg flex flex-col items-center justify-center font-sans text-white">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full mb-6"
      />
      <p className="text-[10px] uppercase tracking-[0.2em] text-frames-text-muted animate-pulse">
        {message}
      </p>
    </div>
  );
};
