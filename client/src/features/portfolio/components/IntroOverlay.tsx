import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoleIcons } from '@/lib/intro-icons';

interface IntroOverlayProps {
  name: string;
  role: string;
  profileImageUrl?: string;
  onComplete: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ name, role, profileImageUrl, onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Check sessionStorage
  useEffect(() => {
    const hasSeen = sessionStorage.getItem('frames_intro_seen');
    if (hasSeen) {
      setShouldRender(false);
      onComplete();
    } else {
      sessionStorage.setItem('frames_intro_seen', 'true');
      
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 2800);

      const completeTimer = setTimeout(() => {
        setShouldRender(false);
        onComplete();
      }, 3200);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [onComplete]);

  // Generate deterministic random positions for icons around the edges
  const icons = useMemo(() => {
    const rawIcons = getRoleIcons(role);
    // Duplicate icons to have exactly 8 for a nice circle effect if needed,
    // or just use the returned ones
    const activeIcons = rawIcons.length > 0 ? rawIcons : ['×', '×', '×', '×'];
    
    // Seeded pseudo-random so it doesn't jump on re-renders
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    return activeIcons.map((icon, i) => {
      // distribute angle
      const angle = (i / activeIcons.length) * Math.PI * 2;
      // random distance from center (but towards edges)
      const dist = 40 + seededRandom(i) * 20; // 40vw to 60vw from center
      const startX = Math.cos(angle) * dist;
      const startY = Math.sin(angle) * dist;

      return {
        id: i,
        icon,
        startX: `${startX}vw`,
        startY: `${startY}vh`,
      };
    });
  }, [role]);

  if (!shouldRender) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Icons Converging */}
          {icons.map((item, i) => {
            const isSvg = item.icon.startsWith('<svg');
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: item.startX, y: item.startY, scale: 1 }}
                animate={{
                  opacity: [0, 0.3, 0.3, 0],
                  x: [item.startX, item.startX, '0vw'],
                  y: [item.startY, item.startY, '0vh'],
                  scale: [1, 1, 0.3]
                }}
                transition={{
                  times: [0, 0.1, 0.25, 0.43], // Mapping to 0, 320ms, 800ms, 1400ms out of 3200 total?
                  // Better: explicitly set duration and delay
                  // 0-800ms: drift slowly (x/y stay same but appear)
                  // 800ms: converge
                  // 1400ms: disappear
                  duration: 1.4,
                  ease: "easeInOut",
                  delay: i * 0.08
                }}
                className="absolute text-white mix-blend-screen pointer-events-none w-6 h-6 flex items-center justify-center"
                dangerouslySetInnerHTML={isSvg ? { __html: item.icon } : undefined}
              >
                {!isSvg && <span className="text-sm font-mono">{item.icon}</span>}
              </motion.div>
            );
          })}

          {/* Gradient Burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 3]
            }}
            transition={{
              duration: 0.4,
              delay: 1.4, // Starts at 1400ms
              ease: "easeOut"
            }}
            className="absolute w-64 h-64 pointer-events-none mix-blend-screen"
            style={{
              background: 'radial-gradient(circle, rgba(192,163,110,0.6), transparent)'
            }}
          />

          {/* Profile Photo or Viewfinder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              delay: 1.6, // Starts at 1600ms
              duration: 0.4
            }}
            className="relative z-10 w-24 h-24 rounded-full border-[1.5px] border-white/20 overflow-hidden flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm"
          >
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
                <path d="M4 8V4h4" />
                <path d="M20 8V4h-4" />
                <path d="M4 16v4h4" />
                <path d="M20 16v4h-4" />
              </svg>
            )}
          </motion.div>

          {/* Creator Name */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 120,
              delay: 2.0 // Starts at 2000ms
            }}
            className="font-display font-bold text-4xl text-white mt-6 z-10 text-center tracking-tight"
          >
            {name}
          </motion.h1>

          {/* Role Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 2.3 // Starts at 2300ms
            }}
            className="font-mono text-xs uppercase tracking-[0.25em] text-[#C0A36E] mt-3 z-10 text-center"
          >
            {role}
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
