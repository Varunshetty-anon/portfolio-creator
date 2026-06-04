// ========================
// FRAMES IntroOverlay Component
// ========================
// Cinematic name/role reveal animation that plays on initial load.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroOverlayProps {
  name: string;
  role: string;
  onComplete: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ name, role, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Complete the animation sequence after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for exit animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Split name for staggered letter animation if needed, or just word fade
  const nameChars = name.split('');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base"
          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="overflow-hidden">
            <motion.h1
              className="text-4xl md:text-6xl lg:text-8xl font-display font-bold tracking-tight text-text-primary mb-4"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {name}
            </motion.h1>
          </div>
          
          <div className="overflow-hidden">
            <motion.p
              className="text-sm md:text-base tracking-[0.3em] uppercase text-text-muted font-medium"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {role}
            </motion.p>
          </div>

          <motion.div 
            className="absolute bottom-12 w-[1px] h-12 bg-gradient-to-b from-text-muted to-transparent"
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, delay: 1, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
