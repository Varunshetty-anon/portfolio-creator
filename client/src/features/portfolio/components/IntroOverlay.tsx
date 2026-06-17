import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortfolioData, Project } from '@/types';

interface IntroOverlayProps {
  data: PortfolioData;
  heroProject: Project | null;
  onComplete: () => void;
}

type Phase = 'hidden' | 'elements' | 'pulling' | 'spinning' | 'reveal' | 'exit';

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ data, heroProject, onComplete }) => {
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
      const lower = (r || '').toLowerCase();
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

    const roleElems = getRoleElements(data.role || '');
    return roleElems.map((name, i) => {
      const angle = (i / roleElems.length) * Math.PI * 2;
      const radius = 35 + Math.random() * 10;
      const top = 50 + Math.sin(angle) * radius;
      const left = 50 + Math.cos(angle) * radius;
      return { id: i, label: name, top: `${top}%`, left: `${left}%` };
    });
  }, [data.role]);

  if (alreadySeen) return null;

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <>
          <motion.div
            key="intro-overlay-bg"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[90] bg-[#050505]"
          />

          {/* PHASE 3 & 4 & 5: Centered Elements */}
          {(phase === 'pulling' || phase === 'spinning' || phase === 'reveal') && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none">
              
              {/* Profile Pic / Glowing Orb Slot */}
              <div className="relative w-[150px] h-[150px] md:w-[180px] md:h-[180px] flex items-center justify-center mb-6">
                  {(phase === 'pulling' || phase === 'spinning' || phase === 'reveal') && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={
                        phase === 'reveal' 
                          ? { scale: 1, opacity: data.profileImageUrl ? 0 : 1 } 
                          : phase === 'spinning' 
                            ? { scale: [1, 1.05, 1], opacity: 1, rotate: 360 } 
                            : { scale: 1, opacity: 1, rotate: 180 }
                      }
                      transition={
                        phase === 'reveal'
                          ? { duration: 0.5 }
                          : phase === 'spinning'
                            ? { scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 4, ease: "linear", repeat: Infinity }, opacity: { duration: 0.4 } }
                            : { duration: 0.8, ease: "easeOut" }
                      }
                      className="absolute rounded-full w-full h-full"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, #FFFFFF 0%, #F5E6C8 25%, #C0A36E 60%, transparent 90%)`,
                        mixBlendMode: 'screen',
                        boxShadow: '0 0 60px 20px rgba(192,163,110,0.6), inset 0 0 30px rgba(255,255,255,0.8)',
                        willChange: 'transform, opacity'
                      }}
                    />
                  )}

                  {/* Profile Image Reveal */}
                  {phase === 'reveal' && data.profileImageUrl && (
                    <motion.img
                      layoutId="intro-profile-image"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      src={data.profileImageUrl}
                      alt={data.name}
                      className="absolute inset-0 w-[100px] h-[100px] md:w-[120px] md:h-[120px] m-auto rounded-full object-cover z-10"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(192,163,110,0.1)' }}
                    />
                  )}
                </div>

                {/* Role */}
                {phase === 'reveal' && data.role && (
                  <motion.div 
                    layoutId="intro-role"
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-[#C0A36E] bg-[#C0A36E]/10 px-3 py-1.5 rounded-full border border-[#C0A36E]/20 mb-5"
                  >
                    {data.role}
                  </motion.div>
                )}
                
                {/* Name */}
                {phase === 'reveal' && (
                  <motion.h1 
                    layoutId="intro-name"
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="font-display font-black uppercase tracking-tighter text-white leading-[0.85] text-center"
                    style={{ fontSize: 'clamp(56px, 8vw, 100px)' }}
                  >
                    {data.name || 'Creative'}
                  </motion.h1>
                )}
                
              </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
