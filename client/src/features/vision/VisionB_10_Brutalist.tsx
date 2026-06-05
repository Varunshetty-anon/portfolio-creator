
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


export default function VisionB_10_Brutalist() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-white flex flex-col font-sans text-black overflow-hidden border-[16px] border-black box-border">
      <div className="flex-1 flex relative">
         <div className="w-[70%] border-r-[16px] border-black bg-black relative">
            <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterUrl} autoplay loop muted />
         </div>
         <div className="w-[30%] flex flex-col bg-yellow-400">
            <div className="p-8 border-b-[16px] border-black">
               <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">{activeProject.title}</h1>
               <div className="mt-8 font-bold text-xl uppercase border-t-4 border-black pt-2">{activeProject.client}</div>
            </div>
            <div className="flex-1 flex flex-col">
               {MOCK_PROJECTS.map((p, i) => (
                  <button key={p.id} onClick={() => setActiveProject(p)} className={`flex-1 border-b-[16px] border-black last:border-b-0 flex items-center p-8 transition-transform ${activeProject.id === p.id ? 'bg-black text-white' : 'hover:bg-white text-black'}`}>
                     <span className="text-4xl font-black">{i+1}. {p.title.toUpperCase()}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
