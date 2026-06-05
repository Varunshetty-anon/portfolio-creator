
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


export default function VisionB_9_FrameIO() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="w-screen h-screen bg-[#0F1115] flex flex-col font-sans text-white overflow-hidden text-sm">
      {/* Top Navbar */}
      <div className="h-14 bg-[#1C1F26] border-b border-[#2A2E37] flex items-center px-6 justify-between">
         <div className="flex items-center gap-4">
           <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold">F</div>
           <span className="font-medium">{activeProject.title}</span>
         </div>
         <div className="flex items-center gap-4 text-[#8A91A1]">
           <span>Review</span>
           <span>Share</span>
           <span>Settings</span>
         </div>
      </div>
      <div className="flex-1 flex p-6 gap-6">
         {/* Main Player */}
         <div className="flex-[3] bg-black rounded-xl overflow-hidden border border-[#2A2E37] relative shadow-2xl">
            <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
         </div>
         {/* Sidebar Sidebar */}
         <div className="flex-1 bg-[#1C1F26] rounded-xl border border-[#2A2E37] p-4 flex flex-col">
            <h3 className="font-medium mb-4 pb-4 border-b border-[#2A2E37]">Project Files</h3>
            <div className="flex flex-col gap-2">
               {MOCK_PROJECTS.map((p, i) => (
                  <button key={p.id} onClick={() => setActiveProject(p)} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${activeProject.id === p.id ? 'bg-[#2A2E37] text-white' : 'hover:bg-[#2A2E37]/50 text-[#8A91A1]'}`}>
                     <div className="w-12 h-8 bg-black rounded overflow-hidden">
                        <img src={p.posterUrl} className="w-full h-full object-cover" />
                     </div>
                     <span className="font-medium truncate">{p.title}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
