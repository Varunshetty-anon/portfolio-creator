
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


export default function VisionB_3_SwissGrid() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col font-sans text-white overflow-hidden p-8">
      <div className="w-full h-full border border-white grid grid-cols-12 grid-rows-6">
        
        {/* Header */}
        <div className="col-span-12 row-span-1 border-b border-white grid grid-cols-12 items-center">
          <div className="col-span-3 px-6 text-xl tracking-tight font-medium">FRAMES</div>
          <div className="col-span-6 px-6 border-l border-r border-white h-full flex flex-col justify-center">
            <h1 className="text-4xl tracking-tighter font-semibold">{activeProject.title}</h1>
          </div>
          <div className="col-span-3 px-6 flex justify-between text-sm">
            <span>{activeProject.client}</span>
            <span>{activeProject.year}</span>
          </div>
        </div>

        {/* Video Area */}
        <div className="col-span-12 row-span-4 border-b border-white relative bg-zinc-900">
          <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
        </div>

        {/* Queue */}
        <div className="col-span-12 row-span-1 grid grid-cols-4">
          {MOCK_PROJECTS.map((p, i) => (
            <button key={p.id} onClick={() => setActiveProject(p)} className={`border-r last:border-r-0 border-white h-full p-6 flex flex-col justify-between text-left transition-colors ${activeProject.id === p.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}>
              <span className="text-sm font-medium">0{i+1}</span>
              <span className="text-xl tracking-tight">{p.title}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
