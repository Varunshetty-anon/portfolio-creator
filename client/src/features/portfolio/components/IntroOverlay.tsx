import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroOverlayProps {
  name: string;
  role: string;
  profileImageUrl?: string;
  onComplete: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ name, role, profileImageUrl, onComplete }) => {
  const [phase, setPhase] = useState<'avatar' | 'name' | 'role' | 'exiting' | 'done'>('avatar');

  // Check if already seen in this session before rendering
  const [hasSeen] = useState(() => {
    try {
      return sessionStorage.getItem('frames_intro_seen') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (hasSeen) {
      onComplete();
      return;
    }

    const nameTimer = setTimeout(() => setPhase('name'), 600);
    const roleTimer = setTimeout(() => setPhase('role'), 1200);
    const exitTimer = setTimeout(() => setPhase('exiting'), 2200);
    const completeTimer = setTimeout(() => {
      try {
        sessionStorage.setItem('frames_intro_seen', 'true');
      } catch (e) {}
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(nameTimer);
      clearTimeout(roleTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [hasSeen, onComplete]);

  if (hasSeen) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            y: '-5%',
            transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] }
          }}
          className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center selection:bg-transparent overflow-hidden"
        >
          <div className="relative flex flex-col items-center justify-center space-y-6">
            
            {/* Profile Avatar */}
            <motion.div
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
               className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-white/10 shadow-2xl bg-white/5"
            >
               {profileImageUrl ? (
                 <img src={profileImageUrl} alt={name} className="w-full h-full object-cover" />
               ) : null}
            </motion.div>

            {/* Name */}
            <div className="h-14 sm:h-16 overflow-hidden flex items-center justify-center">
              <AnimatePresence>
                {(phase === 'name' || phase === 'role' || phase === 'exiting') && (
                  <motion.h1 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white text-center tracking-tight"
                  >
                    {name}
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>

            {/* Role */}
            <div className="h-6 flex items-center justify-center">
              <AnimatePresence>
                {(phase === 'role' || phase === 'exiting') && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="font-display font-bold text-xs sm:text-sm uppercase tracking-[0.2em] text-white/50"
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
