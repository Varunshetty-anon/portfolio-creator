
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


export default function VisionB_8_Editorial() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-[#1A1A1A] flex flex-col font-sans text-white overflow-hidden p-12">
      <div className="flex justify-between items-end mb-12">
         <h1 className="text-7xl font-serif tracking-tighter leading-none">{activeProject.title}</h1>
         <div className="flex flex-col text-right font-mono text-xs text-zinc-400 uppercase tracking-widest gap-2">
            <span>Client: {activeProject.client}</span>
            <span>Role: {activeProject.role}</span>
            <span>Year: {activeProject.year}</span>
         </div>
      </div>
      <div className="flex-1 relative bg-black shadow-2xl">
         <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterUrl} autoplay loop muted />
      </div>
      <div className="h-40 mt-12 flex gap-8">
         {MOCK_PROJECTS.map((p, i) => (
            <button key={p.id} onClick={() => setActiveProject(p)} className={`relative flex-1 group`}>
               <div className="absolute inset-0 bg-black overflow-hidden">
                  <img src={p.posterUrl} className={`w-full h-full object-cover transition-transform duration-700 ${activeProject.id === p.id ? 'scale-105 opacity-100' : 'scale-100 opacity-40 group-hover:opacity-80'}`} />
               </div>
               <div className="absolute inset-0 p-4 flex flex-col justify-between">
                 <span className="font-mono text-[10px] uppercase text-zinc-400">0{i+1}</span>
                 <span className="font-serif text-xl opacity-0 group-hover:opacity-100 transition-opacity">{p.title}</span>
               </div>
            </button>
         ))}
      </div>
    </div>
  );
}
