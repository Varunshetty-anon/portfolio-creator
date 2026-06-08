import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroOverlayProps {
  name: string;
  role: string;
  profileImage?: string;
  onComplete: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ name, role, profileImage, onComplete }) => {
  const [alreadySeen] = useState(() => {
    try { return sessionStorage.getItem('frames_intro_seen') === 'true'; }
    catch { return false; }
  });

  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (alreadySeen) {
      onComplete();
      return;
    }

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2400);

    const completeTimer = setTimeout(() => {
      try { sessionStorage.setItem('frames_intro_seen', 'true'); } catch {}
      onComplete();
    }, 2900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [alreadySeen, onComplete]);

  if (alreadySeen) return null;

  const pathTransition = {
    duration: 0.55,
    ease: "easeInOut",
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center flex-col gap-6"
        >
          {/* Viewfinder SVG */}
          <div className="relative w-10 h-10 flex items-center justify-center text-white">
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ ...pathTransition, delay: 0 }}
                d="M2 10V2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ ...pathTransition, delay: 0.08 }}
                d="M18 2H26V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ ...pathTransition, delay: 0.16 }}
                d="M26 18V26H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ ...pathTransition, delay: 0.24 }}
                d="M10 26H2V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"
              />
            </svg>
          </div>

          <div className="flex flex-col items-center">
            {/* Profile Image */}
            {profileImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                className="mb-6 rounded-full overflow-hidden w-24 h-24 border border-white/10 shadow-lg"
              >
                <img src={profileImage} alt={name} className="w-full h-full object-cover" />
              </motion.div>
            )}

            {/* Creator Name */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.7
              }}
              className="font-display font-bold text-4xl md:text-5xl text-white tracking-tighter text-center"
            >
              {name}
            </motion.h1>

            {/* Role Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: 1.0
              }}
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#C0A36E] mt-3 text-center"
            >
              {role}
            </motion.div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
