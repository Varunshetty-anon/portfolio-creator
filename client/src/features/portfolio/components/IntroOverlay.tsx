import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroOverlayProps {
  name: string;
  role: string;
  profileImage?: string;
  onComplete: () => void;
}

type Phase = 'hidden' | 'elements' | 'pulling' | 'spinning' | 'reveal' | 'exit';

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ name, role, profileImage, onComplete }) => {
  const [alreadySeen] = useState(() => {
    try { return sessionStorage.getItem('frames_intro_seen') === 'true'; }
    catch { return false; }
  });

  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    if (alreadySeen) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setPhase('elements'), 200);
    const t2 = setTimeout(() => setPhase('pulling'), 1200);
    const t3 = setTimeout(() => setPhase('spinning'), 2000);
    const t4 = setTimeout(() => setPhase('reveal'), 2800);
    const t5 = setTimeout(() => setPhase('exit'), 3800);
    const t6 = setTimeout(() => {
      try { sessionStorage.setItem('frames_intro_seen', 'true'); } catch {}
      onComplete();
    }, 4300);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, [alreadySeen, onComplete]);

  const elements = useMemo(() => {
    const getRoleElements = (r: string) => {
      const lower = r.toLowerCase();
      if (lower.includes('video') || lower.includes('editor')) {
        return ['Timeline bar', 'Scissors ✂', 'Play ▶', 'Film 🎬', 'Color wheel circle', 'Waveform squiggle'];
      }
      if (lower.includes('film')) {
        return ['Clapperboard', 'Camera', 'Film reel', 'Viewfinder corners'];
      }
      if (lower.includes('photo')) {
        return ['Camera', 'Aperture circle', 'Grid lines'];
      }
      if (lower.includes('motion')) {
        return ['Triangle', 'Circle', 'Square', 'Bezier curve'];
      }
      if (lower.includes('color')) {
        return ['Color wheel', 'Waveform bars', 'Histogram'];
      }
      return ['Corner Top Left', 'Corner Top Right', 'Corner Bottom Left', 'Corner Bottom Right'];
    };

    const roleElems = getRoleElements(role);
    return roleElems.map((name, i) => {
      // Seeded random positions near edges
      const angle = (i / roleElems.length) * Math.PI * 2;
      const radius = 35 + Math.random() * 10; // 35-45% of viewport
      const top = 50 + Math.sin(angle) * radius;
      const left = 50 + Math.cos(angle) * radius;
      
      return { id: i, label: name, top: `${top}%`, left: `${left}%` };
    });
  }, [role]);

  if (alreadySeen) return null;

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-[#050505] overflow-hidden"
        >
          {/* PHASE 1 & 2: Floating Elements */}
          {(phase === 'elements' || phase === 'pulling') && (
            <div className="absolute inset-0">
              {elements.map((el, i) => (
                <motion.div
                  key={el.id}
                  initial={{ opacity: 0, scale: 0.5, top: el.top, left: el.left, x: '-50%', y: '-50%' }}
                  animate={
                    phase === 'pulling'
                      ? { top: '50%', left: '50%', scale: 0, opacity: 0 }
                      : { opacity: 0.6, scale: 1, y: ['-50%', '-60%', '-40%', '-50%'] }
                  }
                  transition={
                    phase === 'pulling'
                      ? { duration: 0.7, ease: [0.7, 0, 1, 1] }
                      : {
                          opacity: { delay: i * 0.08, duration: 0.4 },
                          scale: { delay: i * 0.08, duration: 0.4 },
                          y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                        }
                  }
                  className="absolute text-white font-mono text-[10px]"
                >
                  {/* Generic SVG representation for the element names to keep it simple, or text if needed. Using text for now as small SVGs would take a lot of code, and user just gave descriptions. Oh wait, user said "Each element is a small SVG icon (20-24px), white...". I will use some generic geometry. */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {el.label.includes('Timeline') && <path d="M4 12h16m-12-4v8m8-8v8"/>}
                    {el.label.includes('Scissors') && <path d="M6 6l12 12m0-12L6 18M4 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>}
                    {el.label.includes('Play') && <polygon points="5 3 19 12 5 21 5 3"/>}
                    {el.label.includes('Film') && <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>}
                    {el.label.includes('Color') && <circle cx="12" cy="12" r="10"/>}
                    {el.label.includes('Waveform') && <path d="M4 12v-4m4 8v-12m4 16V4m4 12v-8m4 4v0"/>}
                    {el.label.includes('Clapper') && <path d="M4 4h16v16H4zm0 4h16m-4-8l-4 4M8 0L4 4"/>}
                    {el.label.includes('Camera') && <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>}
                    {el.label.includes('Aperture') && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                    {el.label.includes('Grid') && <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>}
                    {el.label.includes('Triangle') && <polygon points="12 2 22 20 2 20"/>}
                    {el.label.includes('Circle') && <circle cx="12" cy="12" r="10"/>}
                    {el.label.includes('Square') && <rect x="3" y="3" width="18" height="18"/>}
                    {el.label.includes('Bezier') && <path d="M3 21S10 4 21 3"/>}
                    {el.label.includes('Histogram') && <path d="M3 21h18M5 21v-8m4 8v-14m4 14v-10m4 10v-16"/>}
                    {el.label.includes('Corner Top Left') && <path d="M4 10V4h6"/>}
                    {el.label.includes('Corner Top Right') && <path d="M20 10V4h-6"/>}
                    {el.label.includes('Corner Bottom Left') && <path d="M4 14v6h6"/>}
                    {el.label.includes('Corner Bottom Right') && <path d="M20 14v6h-6"/>}
                  </svg>
                </motion.div>
              ))}
            </div>
          )}

          {/* PHASE 2 & 3: Glowing Orb & Spinning */}
          {(phase === 'pulling' || phase === 'spinning') && (
            <motion.div
              initial={{ scale: 0 }}
              animate={
                phase === 'spinning' 
                  ? { scale: 0.1, rotate: 1440 } 
                  : { scale: 1, rotate: 360 }
              }
              transition={
                phase === 'spinning'
                  ? { duration: 0.8, ease: "easeIn" }
                  : { scale: { duration: 0.3 }, rotate: { duration: 2, ease: "linear" } }
              }
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: '60px',
                height: '60px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,163,100,0.8) 40%, rgba(192,163,110,0.3) 70%, transparent 100%)',
                boxShadow: '0 0 40px 20px rgba(192,163,110,0.4), 0 0 80px 40px rgba(192,163,110,0.15)'
              }}
            />
          )}

          {/* PHASE 4: Reveal */}
          {phase === 'reveal' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {profileImage ? (
                <motion.img
                  initial={{ scale: 0.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                  src={profileImage}
                  alt={name}
                  className="w-[80px] h-[80px] rounded-full object-cover mb-4"
                  style={{ border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 0 30px rgba(192,163,110,0.3)' }}
                />
              ) : (
                <motion.div
                  initial={{ scale: 0.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                  className="w-[40px] h-[40px] mb-4 text-white"
                >
                  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M2 10V2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    <path d="M18 2H26V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    <path d="M26 18V26H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    <path d="M10 26H2V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                  </svg>
                </motion.div>
              )}

              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-bold text-white tracking-tighter text-center"
                style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
              >
                {name}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="font-mono uppercase tracking-[0.25em] text-[#C0A36E] mt-2 text-center"
                style={{ fontSize: 'clamp(11px, 1.2vw, 14px)' }}
              >
                {role}
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
