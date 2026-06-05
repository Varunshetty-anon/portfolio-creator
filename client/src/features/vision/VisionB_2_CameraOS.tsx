
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


export default function VisionB_2_CameraOS() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col font-mono uppercase text-white overflow-hidden relative">
      <div className="absolute inset-0 border-[4px] border-zinc-900 pointer-events-none z-50"></div>
      <div className="absolute inset-4 border border-zinc-800/50 pointer-events-none z-50 flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-l-2 border-red-500/50 absolute top-4 left-4"></div>
        <div className="w-8 h-8 border-t-2 border-r-2 border-red-500/50 absolute top-4 right-4"></div>
        <div className="w-8 h-8 border-b-2 border-l-2 border-red-500/50 absolute bottom-4 left-4"></div>
        <div className="w-8 h-8 border-b-2 border-r-2 border-red-500/50 absolute bottom-4 right-4"></div>
      </div>
      
      {/* Video */}
      <div className="absolute inset-0">
        <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterUrl} autoplay loop muted />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Meta HUD */}
      <div className="absolute top-8 left-8 z-40 text-sm tracking-widest text-red-500 flex flex-col gap-1">
        <span>REC</span>
        <span className="text-white/50">{activeProject.client}</span>
      </div>
      <div className="absolute top-8 right-8 z-40 text-sm tracking-widest text-white/50">
        1080P / 24FPS
      </div>

      {/* Queue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-4 bg-black/80 backdrop-blur px-6 py-4 border border-zinc-800">
        {MOCK_PROJECTS.map((p, i) => (
          <button key={p.id} onClick={() => setActiveProject(p)} className={`flex flex-col items-center gap-2 transition-all ${activeProject.id === p.id ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-100'}`}>
            <div className={`w-24 h-16 border-2 ${activeProject.id === p.id ? 'border-red-500' : 'border-zinc-700'}`}>
              <img src={p.posterUrl} className="w-full h-full object-cover grayscale" />
            </div>
            <span className="text-[10px] tracking-widest">{p.id.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
