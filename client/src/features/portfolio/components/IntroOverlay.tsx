import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroOverlayProps {
  name: string;
  role: string;
  onComplete: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ name, role, onComplete }) => {
  const [phase, setPhase] = useState<'drawing' | 'name' | 'role' | 'exiting' | 'done'>('drawing');

  useEffect(() => {
    // Phase 1: Drawing (0 - 600ms) - handled by CSS animation in the SVG
    const nameTimer = setTimeout(() => setPhase('name'), 600);
    const roleTimer = setTimeout(() => setPhase('role'), 1400);
    const exitTimer = setTimeout(() => setPhase('exiting'), 2200);
    const completeTimer = setTimeout(() => {
      // Mark as seen for this session
      try {
        sessionStorage.setItem('frames_intro_seen', 'true');
      } catch (e) {}
      onComplete();
    }, 2800); // 2200 + 600ms exit animation

    return () => {
      clearTimeout(nameTimer);
      clearTimeout(roleTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Check if already seen in this session before rendering
  const [hasSeen] = useState(() => {
    try {
      return sessionStorage.getItem('frames_intro_seen') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (hasSeen) onComplete();
  }, [hasSeen, onComplete]);

  if (hasSeen) return null;

  // Viewfinder path length for animation
  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.05, type: "spring", duration: 0.6, bounce: 0 },
        opacity: { delay: i * 0.05, duration: 0.01 }
      }
    })
  };

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] } // ease-in for film sweep effect
          }}
          className="fixed inset-0 z-[100] bg-bg-base flex flex-col items-center justify-center selection:bg-transparent"
        >
          {/* Animated Film Sweep on Exit */}
          {phase === 'exiting' && (
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/3 bg-white/5 blur-[100px] transform skew-x-12"
            />
          )}

          <div className="relative flex flex-col items-center">
            {/* Viewfinder Logo */}
            <motion.svg 
              width="48" 
              height="48" 
              viewBox="0 0 28 28" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-text-primary mb-8"
            >
              {/* Top Left */}
              <motion.path d="M2 10V2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" custom={0} variants={drawLine} initial="hidden" animate="visible" />
              {/* Top Right */}
              <motion.path d="M18 2H26V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" custom={1} variants={drawLine} initial="hidden" animate="visible" />
              {/* Bottom Right */}
              <motion.path d="M26 18V26H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" custom={2} variants={drawLine} initial="hidden" animate="visible" />
              {/* Bottom Left */}
              <motion.path d="M10 26H2V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" custom={3} variants={drawLine} initial="hidden" animate="visible" />
            </motion.svg>

            {/* Name */}
            <div className="h-16 overflow-hidden flex items-center justify-center mb-2">
              <AnimatePresence>
                {(phase === 'name' || phase === 'role') && (
                  <motion.h1 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-text-primary text-center tracking-tight"
                  >
                    {name}
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>

            {/* Role */}
            <div className="h-6 flex items-center justify-center">
              <AnimatePresence>
                {phase === 'role' && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-[0.25em] text-text-muted"
                  >
                    {role}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
