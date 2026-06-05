import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

const CREATOR = { name: 'CHRISTOPHER NOLAN', role: 'DIRECTOR', contact: 'hire@syncopy.com' };

const PROJECTS = [
  { id: 'p1', title: 'THE ARCHITECT', role: 'Director', client: 'Syncopy', videoUrl: 'https://vimeo.com/76979871', posterFrameUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p2', title: 'NEON DREAMS', role: 'Lead Editor', client: 'Cyberdyne', videoUrl: 'https://vimeo.com/824804225', posterFrameUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p3', title: 'ECHOES', role: 'Colorist', client: 'A24', videoUrl: 'https://vimeo.com/336812686', posterFrameUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p4', title: 'VELOCITY', role: 'VFX Supervisor', client: 'Nike', videoUrl: 'https://vimeo.com/22439234', posterFrameUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=100&w=2000' },
];

export default function VisionC() {
  const [activeId, setActiveId] = useState(PROJECTS[0].id);
  const activeProject = PROJECTS.find(p => p.id === activeId)!;

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] text-[#f4f4f0] overflow-hidden" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
      
      {/* Absolute massive background creator name, rotated */}
      <div className="absolute left-0 top-0 bottom-0 w-32 flex items-center justify-center pointer-events-none z-10 mix-blend-difference overflow-hidden">
        <h1 className="text-[12vh] font-bold tracking-tighter uppercase whitespace-nowrap -rotate-90 opacity-80">
          {CREATOR.name}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeProject.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 z-0">
          <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterFrameUrl} aspectRatio="16:9" autoplay loop muted={false} controls />
          {/* Subtle noise/grain overlay for fashion/editorial feel */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        </motion.div>
      </AnimatePresence>

      {/* Avant-Garde Metadata Lockup - Top Right */}
      <div className="absolute top-12 right-12 text-right z-20 pointer-events-none mix-blend-difference">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.8] mb-4">
          {activeProject.title}
        </h2>
        <div className="text-sm font-medium tracking-widest uppercase flex flex-col items-end gap-1">
          <span>{activeProject.client}</span>
          <span className="opacity-50">—</span>
          <span>{activeProject.role}</span>
        </div>
      </div>

      {/* Massive Underlined Contact */}
      <div className="absolute bottom-12 right-12 z-20 mix-blend-difference">
        <a href={`mailto:${CREATOR.contact}`} className="text-2xl md:text-4xl font-bold tracking-tighter uppercase border-b-4 border-white hover:text-black hover:bg-white hover:border-black transition-all">
          BOOKINGS
        </a>
      </div>

      {/* Floating Stacking Queue */}
      <div className="absolute bottom-12 left-32 z-30 flex gap-4">
        {PROJECTS.map((p, index) => {
          const isActive = p.id === activeId;
          return (
            <button 
              key={p.id} 
              onClick={() => setActiveId(p.id)} 
              className={`relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive ? 'w-48 aspect-[4/5] -translate-y-4 shadow-2xl' : 'w-32 aspect-[3/4] opacity-50 hover:opacity-100 hover:-translate-y-2'}`}
            >
              <img src={p.posterFrameUrl} className="absolute inset-0 w-full h-full object-cover" alt={p.title} />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-4 left-4 text-left">
                <span className="text-white font-bold tracking-tighter text-xl leading-none">0{index + 1}</span>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
