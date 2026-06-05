
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


export default function VisionB_4_Terminal() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col font-mono text-green-500 overflow-hidden p-4">
      <div className="flex-1 border border-green-900 relative flex flex-col">
        <div className="border-b border-green-900 p-2 text-xs">
          {'>'} ./frames-os execute --project "{activeProject.id}" --mode "playback"
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 relative bg-black border-r border-green-900">
             <div className="absolute inset-0 opacity-80 mix-blend-screen grayscale contrast-150">
                <FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterUrl} autoplay loop muted />
             </div>
             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
          </div>
          <div className="w-80 p-4 flex flex-col gap-4 text-xs">
             <div className="border border-green-900 p-4">
                <div>[STATUS]: RENDERING</div>
                <div>[TITLE]: {activeProject.title}</div>
                <div>[ROLE]: {activeProject.role}</div>
                <div>[YEAR]: {activeProject.year}</div>
             </div>
             <div className="flex-1 flex flex-col gap-2">
                <div>{'>'} QUEUE:</div>
                {MOCK_PROJECTS.map((p, i) => (
                  <button key={p.id} onClick={() => setActiveProject(p)} className={`text-left p-2 border ${activeProject.id === p.id ? 'border-green-500 bg-green-900/30' : 'border-green-900/50 hover:border-green-500/50'}`}>
                    [{i}] {p.title}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
