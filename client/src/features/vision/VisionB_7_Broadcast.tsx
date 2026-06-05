
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


export default function VisionB_7_Broadcast() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-black flex font-mono text-white overflow-hidden">
      <div className="flex-1 relative p-8">
        <div className="absolute inset-8 border-2 border-dashed border-zinc-800 pointer-events-none z-50"></div>
        <div className="absolute inset-20 border border-dotted border-zinc-800 pointer-events-none z-50"></div>
        <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterUrl} autoplay loop muted />
      </div>
      <div className="w-96 bg-[#111] border-l border-zinc-800 flex flex-col">
         <div className="h-48 bg-black flex">
            {/* Fake SMPTE bars */}
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-cyan-400"></div>
            <div className="flex-1 bg-green-500"></div>
            <div className="flex-1 bg-magenta-500"></div>
            <div className="flex-1 bg-red-500"></div>
            <div className="flex-1 bg-blue-600"></div>
         </div>
         <div className="p-6 border-b border-zinc-800">
           <div className="text-xs text-zinc-500 mb-2">PGM OUTPUT</div>
           <div className="text-2xl">{activeProject.title.toUpperCase()}</div>
           <div className="text-sm text-red-500 mt-2">● REC 00:00:00:00</div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {MOCK_PROJECTS.map((p, i) => (
              <button key={p.id} onClick={() => setActiveProject(p)} className={`flex items-center gap-4 p-2 border ${activeProject.id === p.id ? 'border-red-500 bg-red-500/10' : 'border-zinc-800 hover:bg-zinc-900'} text-left`}>
                 <div className={`w-16 h-12 bg-black border ${activeProject.id === p.id ? 'border-red-500' : 'border-zinc-800'}`}>
                    <img src={p.posterUrl} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex flex-col text-xs">
                    <span>CH {i+1}</span>
                    <span className="text-zinc-500">{p.id}</span>
                 </div>
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
