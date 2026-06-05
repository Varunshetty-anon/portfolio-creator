import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

const CREATOR = { name: 'CHRISTOPHER NOLAN', role: 'LEAD EDITOR', contact: 'hire@syncopy.com' };

const PROJECTS = [
  { id: 'p1', title: 'THE ARCHITECT', role: 'Director', client: 'Syncopy', videoUrl: 'https://vimeo.com/76979871', posterFrameUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p2', title: 'NEON DREAMS', role: 'Lead Editor', client: 'Cyberdyne', videoUrl: 'https://vimeo.com/824804225', posterFrameUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p3', title: 'ECHOES', role: 'Colorist', client: 'A24', videoUrl: 'https://vimeo.com/336812686', posterFrameUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=100&w=2000' },
  { id: 'p4', title: 'VELOCITY', role: 'VFX Supervisor', client: 'Nike', videoUrl: 'https://vimeo.com/22439234', posterFrameUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=100&w=2000' },
];

export default function VisionB() {
  const [activeId, setActiveId] = useState(PROJECTS[0].id);
  const activeProject = PROJECTS.find(p => p.id === activeId)!;

  return (
    <div className="relative w-full h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-mono flex flex-col">
      
      {/* Top Control Bar */}
      <div className="h-12 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center px-4 text-[10px] tracking-widest flex-shrink-0 z-20">
        <div className="flex items-center gap-6">
          <span className="text-white font-bold">{CREATOR.name}</span>
          <span className="text-zinc-500">///</span>
          <span className="text-zinc-400">{CREATOR.role}</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <span className="text-zinc-600">CLIENT:</span>
            <span className="text-zinc-300">{activeProject.client}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-600">ROLE:</span>
            <span className="text-zinc-300">{activeProject.role}</span>
          </div>
          <a href={`mailto:${CREATOR.contact}`} className="bg-zinc-800 text-white px-3 py-1 hover:bg-zinc-700 transition-colors">
            CONTACT
          </a>
        </div>
      </div>

      {/* Program Monitor */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeProject.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="relative w-full max-w-7xl aspect-video border border-zinc-800 bg-zinc-900 shadow-2xl">
            <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterFrameUrl} aspectRatio="16:9" autoplay loop muted={false} controls />
            
            {/* Minimal Title Overlay */}
            <div className="absolute bottom-0 left-0 p-4 pointer-events-none mix-blend-difference">
              <h2 className="text-2xl font-bold tracking-tight text-white">{activeProject.title}</h2>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Master Timeline Queue */}
      <div className="h-48 border-t border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0">
        <div className="h-6 border-b border-zinc-900 flex items-center px-4 text-[9px] tracking-widest text-zinc-600">
          TIMELINE / QUEUE
        </div>
        <div className="flex-1 flex p-4 gap-1 overflow-x-auto hide-scrollbar">
          {PROJECTS.map(p => {
            const isActive = p.id === activeId;
            return (
              <button 
                key={p.id} 
                onClick={() => setActiveId(p.id)} 
                className={`relative h-full aspect-video flex-shrink-0 border transition-all ${isActive ? 'border-zinc-400' : 'border-zinc-800 hover:border-zinc-600'}`}
              >
                <img src={p.posterFrameUrl} className={`w-full h-full object-cover ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`} alt={p.title} />
                {isActive && <div className="absolute top-0 inset-x-0 h-1 bg-zinc-400" />}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
