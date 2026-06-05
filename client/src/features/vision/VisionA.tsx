import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

const CREATOR = { name: 'Christopher Nolan', role: 'Director', contact: 'hire@syncopy.com' };

const PROJECTS = [
  { id: 'p1', title: 'The Architect', role: 'Director', client: 'Syncopy', videoUrl: 'https://vimeo.com/76979871', posterFrameUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p2', title: 'Neon Dreams', role: 'Lead Editor', client: 'Cyberdyne', videoUrl: 'https://vimeo.com/824804225', posterFrameUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p3', title: 'Echoes', role: 'Colorist', client: 'A24', videoUrl: 'https://vimeo.com/336812686', posterFrameUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p4', title: 'Velocity', role: 'VFX Supervisor', client: 'Nike', videoUrl: 'https://vimeo.com/22439234', posterFrameUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=100&w=2000' },
];

export default function VisionA() {
  const [activeId, setActiveId] = useState(PROJECTS[0].id);
  const [showQueue, setShowQueue] = useState(false);
  const activeProject = PROJECTS.find(p => p.id === activeId)!;

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden" style={{ fontFamily: 'Georgia, serif' }}>
      
      <AnimatePresence mode="wait">
        <motion.div key={activeProject.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: "easeInOut" }} className="absolute inset-0 z-0">
          <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterFrameUrl} aspectRatio="16:9" autoplay loop muted={false} controls />
        </motion.div>
      </AnimatePresence>

      {/* Top Bar - Minimal, Elegant */}
      <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-center z-10 pointer-events-none mix-blend-difference">
        <h1 className="text-2xl italic tracking-wide">{CREATOR.name}</h1>
        <a href={`mailto:${CREATOR.contact}`} className="pointer-events-auto font-sans text-[10px] tracking-[0.2em] uppercase border-b border-white/30 pb-1 hover:border-white transition-colors">
          Inquiries
        </a>
      </div>

      {/* Bottom Lockup - Cinema Poster Billing Block Style */}
      <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none mix-blend-difference p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-6xl md:text-8xl tracking-tight uppercase mb-4 font-light">{activeProject.title}</h2>
          <div className="flex gap-6 font-sans text-[9px] tracking-[0.3em] uppercase opacity-70">
            <span>{activeProject.client}</span>
            <span>|</span>
            <span>{activeProject.role}</span>
          </div>
        </div>
      </div>

      {/* Trigger Zone for Queue */}
      <div className="absolute bottom-0 inset-x-0 h-32 z-30" onMouseEnter={() => setShowQueue(true)} onMouseLeave={() => setShowQueue(false)}>
        <motion.div 
          initial={{ y: '100%' }} 
          animate={{ y: showQueue ? '0%' : '100%' }} 
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 inset-x-0 bg-black py-12 px-8 flex justify-center gap-8"
        >
          {PROJECTS.map(p => (
            <button key={p.id} onClick={() => setActiveId(p.id)} className={`relative group w-48 md:w-64 transition-all duration-700 ${p.id === activeId ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-100'}`}>
              <div className="aspect-[3/4] w-full overflow-hidden">
                <img src={p.posterFrameUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={p.title} />
              </div>
              <p className="mt-4 text-center font-serif italic text-sm">{p.title}</p>
            </button>
          ))}
        </motion.div>
      </div>

    </div>
  );
}
