
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


export default function VisionB_5_DieterRams() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-[#EBEBEB] flex flex-col items-center justify-center font-sans text-zinc-800 p-12">
      <div className="w-full max-w-7xl aspect-video bg-[#D9D9D9] rounded-3xl p-8 shadow-[20px_20px_60px_#c8c8c8,-20px_-20px_60px_#ffffff] flex flex-col">
        {/* Device screen */}
        <div className="w-full flex-1 bg-black rounded-xl overflow-hidden relative shadow-inner">
           <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
        </div>
        {/* Physical controls */}
        <div className="h-32 mt-8 flex items-center justify-between px-8">
           <div className="flex flex-col">
             <span className="text-sm font-bold tracking-widest uppercase text-zinc-400">BRAUN / FRAMES</span>
             <h2 className="text-3xl font-medium tracking-tight">{activeProject.title}</h2>
           </div>
           <div className="flex gap-4">
              {MOCK_PROJECTS.map((p, i) => (
                <button key={p.id} onClick={() => setActiveProject(p)} className={`w-16 h-12 rounded-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all ${activeProject.id === p.id ? 'bg-[#FF5A00] border-[#CC4800] text-white' : 'bg-[#E0E0E0] border-[#BDBDBD] text-zinc-500'} flex items-center justify-center font-medium`}>
                  {i+1}
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
