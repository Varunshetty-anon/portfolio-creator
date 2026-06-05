
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FramesPlayer } from '@/components/shared/FramesPlayer';


const MOCK_PROJECTS = [
  {
    id: 'p1',
    title: 'Neon Odyssey',
    role: 'Director & Editor',
    client: 'HyperX',
    year: '2024',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1609241517/rooster.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=100&w=2000',
  },
  {
    id: 'p2',
    title: 'Silent Echo',
    role: 'Colorist',
    client: 'A24 Films',
    year: '2023',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1609241517/dog.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=100&w=2000',
  },
  {
    id: 'p3',
    title: 'Velocity',
    role: 'Motion Designer',
    client: 'Nike',
    year: '2024',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1609241517/cat.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=100&w=2000',
  },
  {
    id: 'p4',
    title: 'Raw Texture',
    role: 'Editor',
    client: 'Vogue',
    year: '2023',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1609241517/rooster.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=100&w=2000',
  }
];


export default function VisionB_6_MicroUI() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col font-sans text-white overflow-hidden relative group">
      <div className="absolute inset-4 lg:inset-8 xl:inset-12 z-0">
         <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterUrl} autoplay loop muted />
      </div>
      <div className="absolute bottom-0 w-full h-12 bg-black/90 backdrop-blur-md z-50 flex items-center px-12 border-t border-zinc-800 text-[10px] tracking-[0.2em] uppercase justify-between translate-y-full group-hover:translate-y-0 transition-transform duration-500">
         <div className="flex gap-12">
           <span className="text-zinc-500">FRAMES</span>
           <span>{activeProject.title} // {activeProject.client}</span>
         </div>
         <div className="flex gap-8">
            {MOCK_PROJECTS.map((p, i) => (
              <button key={p.id} onClick={() => setActiveProject(p)} className={`transition-colors ${activeProject.id === p.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'}`}>
                0{i+1}. {p.id}
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
