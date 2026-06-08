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
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-[#050505] overflow-hidden"
        >
          {/* PHASE 1 & 2: Floating Elements */}
          {(phase === 'elements' || phase === 'pulling') && (
            <div className="absolute inset-0 z-0">
              {elements.map((el, i) => (
                <motion.div
                  key={el.id}
                  initial={{ opacity: 0, scale: 0.5, top: el.top, left: el.left, x: '-50%', y: '-50%' }}
                  animate={
                    phase === 'pulling'
                      ? { scale: 0, opacity: 0 }
                      : { opacity: 0.4, scale: 1, y: ['-50%', '-60%', '-40%', '-50%'] }
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {el.label.includes('Timeline') && <path d="M4 12h16m-12-4v8m8-8v8"/>}
                    {el.label.includes('Scissors') && <path d="M6 6l12 12m0-12L6 18M4 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>}
                    {el.label.includes('Play') && <polygon points="5 3 19 12 5 21 5 3"/>}
                    {el.label.includes('Film') && <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>}
                    {el.label.includes('Color') && <circle cx="12" cy="12" r="10"/>}
                    {el.label.includes('Waveform') && <path d="M4 12v-4m4 8v-12m4 16V4m4 12v-8m4 4v0"/>}
                    {el.label.includes('Clapper') && <path d="M4 4h16v16H4zm0 4h16m-4-8l-4 4M8 0L4 4"/>}
                    {el.label.includes('Camera') && <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>}
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

          {/* EXACT Layout Replication for perfect alignment with PortfolioLayout */}
          <section className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center px-6 pt-24 pb-12 md:px-14 z-10 pointer-events-none">
            <div className={`w-full max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-12 xl:gap-20 items-center ${heroProject ? 'justify-between' : 'justify-center text-center'}`}>
              
              <div className={`flex-1 w-full max-w-3xl shrink-0 flex flex-col ${!heroProject ? 'items-center' : ''}`}>
                
                {/* Profile Pic / Glowing Orb Slot */}
                <div className="mb-6 relative w-[80px] h-[80px] flex items-center justify-center">
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
                      className="absolute rounded-full"
                      style={{
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,1) 0%, rgba(220,190,130,0.85) 45%, rgba(150,120,70,0.4) 80%, transparent 100%)',
                        filter: 'blur(3px)',
                        mixBlendMode: 'screen',
                        boxShadow: '0 0 40px 10px rgba(192,163,110,0.4), inset 0 0 15px rgba(255,255,255,0.9)'
                      }}
                    />
                  )}

                  {/* Profile Image Reveal */}
                  {phase === 'reveal' && data.profileImageUrl && (
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      src={data.profileImageUrl}
                      alt={data.name}
                      className="absolute inset-0 w-full h-full rounded-full object-cover z-10"
                      style={{ border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 0 40px rgba(192,163,110,0.15)' }}
                    />
                  )}
                </div>

                <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#C0A36E] mb-4 h-[16px]">
                  {phase === 'reveal' ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                      {data.role || 'Portfolio'}
                    </motion.div>
                  ) : <div className="opacity-0">{data.role || 'Portfolio'}</div>}
                </div>
                
                <h1 
                  className="font-display font-black uppercase tracking-tighter text-white leading-[0.9] mb-8"
                  style={{ fontSize: 'clamp(48px, 8vw, 110px)' }}
                >
                  {phase === 'reveal' ? (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                      {data.name || 'Creative'}
                    </motion.div>
                  ) : <div className="opacity-0">{data.name || 'Creative'}</div>}
                </h1>
                
                <p className={`max-w-md font-light text-base md:text-lg text-white/50 leading-[1.7] mb-8 opacity-0 ${!heroProject ? 'mx-auto' : ''}`}>
                  {data.bio || 'Invisible spacer'}
                </p>
                
                <div className={`flex flex-col gap-3 opacity-0 ${!heroProject ? 'items-center' : ''}`}>
                  {data.location && <div className="font-mono text-xs text-white/30 uppercase">{data.location}</div>}
                  {data.availability?.status && <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10 rounded-full h-[26px]"></div>}
                </div>
              </div>

              {heroProject && (
                <div className="w-full xl:w-[55%] shrink-0 opacity-0 pointer-events-none">
                  <div className="w-full aspect-video relative rounded-xl" />
                </div>
              )}
              
            </div>
          </section>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
