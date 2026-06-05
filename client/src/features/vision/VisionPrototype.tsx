import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

// Hardcoded Mock Data
const CREATOR = {
  name: 'CHRISTOPHER NOLAN',
  role: 'DIRECTOR',
  contact: 'christopher@syncopy.com',
};

const PROJECTS = [
  {
    id: 'p1',
    title: 'THE ARCHITECT',
    role: 'Director',
    client: 'Syncopy',
    videoUrl: 'https://vimeo.com/76979871',
    posterFrameUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=100&w=2000',
  },
  {
    id: 'p2',
    title: 'NEON DREAMS',
    role: 'Lead Editor',
    client: 'Cyberdyne',
    videoUrl: 'https://vimeo.com/824804225',
    posterFrameUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=100&w=2000',
  },
  {
    id: 'p3',
    title: 'ECHOES',
    role: 'Colorist',
    client: 'A24',
    videoUrl: 'https://vimeo.com/336812686',
    posterFrameUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=100&w=2000',
  },
  {
    id: 'p4',
    title: 'VELOCITY',
    role: 'VFX Supervisor',
    client: 'Nike',
    videoUrl: 'https://vimeo.com/22439234',
    posterFrameUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=100&w=2000',
  },
  {
    id: 'p5',
    title: 'THE DEEP',
    role: 'Director of Photography',
    client: 'National Geographic',
    videoUrl: 'https://vimeo.com/253989945',
    posterFrameUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=100&w=2000',
  },
];

export default function VisionPrototype() {
  const [activeProjectId, setActiveProjectId] = useState(PROJECTS[0].id);
  const [isQueueHovered, setIsQueueHovered] = useState(false);

  const activeProject = PROJECTS.find(p => p.id === activeProjectId) || PROJECTS[0];

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-display">
      
      {/* BACKGROUND: The Program Monitor (100% viewport) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProject.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          {/* We pass posterFrameUrl to FramesPlayer to ensure Cinematic Facade */}
          <FramesPlayer
            url={activeProject.videoUrl}
            thumbnail={activeProject.posterFrameUrl}
            aspectRatio="16:9"
            autoplay={true}
            muted={false}
            loop={true}
            controls={true}
          />
        </motion.div>
      </AnimatePresence>

      {/* FOREGROUND: Bezel UI (Top) */}
      <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-start z-10 pointer-events-none mix-blend-difference">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase leading-none">
            {CREATOR.name}
          </h1>
          <p className="font-mono text-xs tracking-widest text-white/70 uppercase mt-1">
            {CREATOR.role}
          </p>
        </div>
        <a 
          href={`mailto:${CREATOR.contact}`}
          className="pointer-events-auto font-mono text-xs tracking-widest uppercase border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors"
        >
          Hire Me
        </a>
      </div>

      {/* ACTIVE METADATA: Bottom Left (moves up slightly if queue opens) */}
      <motion.div 
        className="absolute left-8 z-10 pointer-events-none mix-blend-difference"
        animate={{ bottom: isQueueHovered ? '240px' : '48px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-2">
          {activeProject.title}
        </h2>
        <div className="flex gap-4 font-mono text-xs tracking-widest text-white/70 uppercase">
          <span>{activeProject.role}</span>
          <span>&times;</span>
          <span>{activeProject.client}</span>
        </div>
      </motion.div>

      {/* THE HYBRID QUEUE: Bottom Edge Trigger + Slide Up Panel */}
      <div 
        className="absolute bottom-0 inset-x-0 z-20"
        onMouseEnter={() => setIsQueueHovered(true)}
        onMouseLeave={() => setIsQueueHovered(false)}
      >
        {/* The Trigger Zone (invisible height to catch hover, plus the visible line) */}
        <div className="h-16 w-full flex items-end justify-center pb-4 cursor-pointer">
          <motion.div 
            animate={{ opacity: isQueueHovered ? 0 : 1 }}
            className="w-1/3 max-w-[200px] h-[2px] bg-white/30 rounded-full"
          />
        </div>

        {/* The Queue Panel */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: isQueueHovered ? '0%' : '100%' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-black/80 backdrop-blur-xl border-t border-white/10 px-8 py-6"
        >
          <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {PROJECTS.map((project) => {
              const isActive = project.id === activeProjectId;
              return (
                <button
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  className={`relative flex-shrink-0 group overflow-hidden transition-all duration-500 ease-out ${
                    isActive ? 'w-64 md:w-80 opacity-100 ring-1 ring-white/50' : 'w-48 md:w-60 opacity-50 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-video w-full bg-zinc-900">
                    <img 
                      src={project.posterFrameUrl} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  {/* Subtle gradient to ensure text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-4 text-left w-full">
                    <h3 className="font-display font-bold uppercase tracking-tight text-lg leading-none truncate">
                      {project.title}
                    </h3>
                    <p className="font-mono text-[10px] tracking-widest text-white/60 uppercase mt-1 truncate">
                      {project.role}
                    </p>
                  </div>
                </button>
              );
            })}
            
            <button className="flex-shrink-0 w-32 aspect-video flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors uppercase font-mono text-xs tracking-widest">
              Archive &rarr;
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
