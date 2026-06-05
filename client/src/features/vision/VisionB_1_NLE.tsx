
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


export default function VisionB_1_NLE() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-[#18181b] flex flex-col text-[12px] font-sans text-zinc-300 overflow-hidden">
      {/* Top Bar */}
      <div className="h-8 border-b border-zinc-800 flex items-center px-4 justify-between bg-[#1f1f23]">
        <div className="flex gap-4">
          <span className="text-zinc-500">File</span>
          <span className="text-zinc-500">Edit</span>
          <span className="text-white font-medium">Workspaces</span>
        </div>
        <span>{activeProject.title} — Sequence 01</span>
      </div>
      {/* Player Area */}
      <div className="flex-1 relative bg-black p-4 flex items-center justify-center">
        <div className="relative w-full h-full max-w-6xl max-h-full border border-zinc-800 shadow-2xl">
          <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
        </div>
      </div>
      {/* Timeline Queue */}
      <div className="h-64 border-t border-zinc-800 bg-[#1f1f23] flex flex-col">
        <div className="h-8 border-b border-zinc-800 flex items-center px-4 text-[10px] uppercase tracking-wider text-zinc-500">
          Timeline / Queue
        </div>
        <div className="flex-1 flex items-end p-4 gap-1">
          {MOCK_PROJECTS.map((p, i) => (
            <button key={p.id} onClick={() => setActiveProject(p)} className={`relative h-20 flex-1 border ${activeProject.id === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 bg-zinc-800'} transition-all hover:border-zinc-500 flex flex-col justify-end p-2 text-left`}>
              <span className={`truncate ${activeProject.id === p.id ? 'text-blue-400' : 'text-zinc-400'}`}>{p.title}</span>
              <span className="text-[10px] text-zinc-600">V{i+1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
