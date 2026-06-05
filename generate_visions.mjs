import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.join(process.cwd(), 'client/src/features/vision');

const PROJECTS = `
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
`;

const BASE_TEMPLATE = (name, renderCode) => `
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

${PROJECTS}

export default function ${name}() {
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);

  return (
    ${renderCode}
  );
}
`;

const variations = [
  {
    name: 'VisionB_1_NLE',
    code: `<div className="w-screen h-screen bg-[#18181b] flex flex-col text-[12px] font-sans text-zinc-300 overflow-hidden">
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
            <button key={p.id} onClick={() => setActiveProject(p)} className={\`relative h-20 flex-1 border \${activeProject.id === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 bg-zinc-800'} transition-all hover:border-zinc-500 flex flex-col justify-end p-2 text-left\`}>
              <span className={\`truncate \${activeProject.id === p.id ? 'text-blue-400' : 'text-zinc-400'}\`}>{p.title}</span>
              <span className="text-[10px] text-zinc-600">V{i+1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>`
  },
  {
    name: 'VisionB_2_CameraOS',
    code: `<div className="w-screen h-screen bg-black flex flex-col font-mono uppercase text-white overflow-hidden relative">
      <div className="absolute inset-0 border-[4px] border-zinc-900 pointer-events-none z-50"></div>
      <div className="absolute inset-4 border border-zinc-800/50 pointer-events-none z-50 flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-l-2 border-red-500/50 absolute top-4 left-4"></div>
        <div className="w-8 h-8 border-t-2 border-r-2 border-red-500/50 absolute top-4 right-4"></div>
        <div className="w-8 h-8 border-b-2 border-l-2 border-red-500/50 absolute bottom-4 left-4"></div>
        <div className="w-8 h-8 border-b-2 border-r-2 border-red-500/50 absolute bottom-4 right-4"></div>
      </div>
      
      {/* Video */}
      <div className="absolute inset-0">
        <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
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
          <button key={p.id} onClick={() => setActiveProject(p)} className={\`flex flex-col items-center gap-2 transition-all \${activeProject.id === p.id ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-100'}\`}>
            <div className={\`w-24 h-16 border-2 \${activeProject.id === p.id ? 'border-red-500' : 'border-zinc-700'}\`}>
              <img src={p.posterUrl} className="w-full h-full object-cover grayscale" />
            </div>
            <span className="text-[10px] tracking-widest">{p.id.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>`
  },
  {
    name: 'VisionB_3_SwissGrid',
    code: `<div className="w-screen h-screen bg-black flex flex-col font-sans text-white overflow-hidden p-8">
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
            <button key={p.id} onClick={() => setActiveProject(p)} className={\`border-r last:border-r-0 border-white h-full p-6 flex flex-col justify-between text-left transition-colors \${activeProject.id === p.id ? 'bg-white text-black' : 'hover:bg-white/10'}\`}>
              <span className="text-sm font-medium">0{i+1}</span>
              <span className="text-xl tracking-tight">{p.title}</span>
            </button>
          ))}
        </div>

      </div>
    </div>`
  },
  {
    name: 'VisionB_4_Terminal',
    code: `<div className="w-screen h-screen bg-black flex flex-col font-mono text-green-500 overflow-hidden p-4">
      <div className="flex-1 border border-green-900 relative flex flex-col">
        <div className="border-b border-green-900 p-2 text-xs">
          > ./frames-os execute --project "{activeProject.id}" --mode "playback"
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 relative bg-black border-r border-green-900">
             <div className="absolute inset-0 opacity-80 mix-blend-screen grayscale contrast-150">
                <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
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
                <div>> QUEUE:</div>
                {MOCK_PROJECTS.map((p, i) => (
                  <button key={p.id} onClick={() => setActiveProject(p)} className={\`text-left p-2 border \${activeProject.id === p.id ? 'border-green-500 bg-green-900/30' : 'border-green-900/50 hover:border-green-500/50'}\`}>
                    [{i}] {p.title}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>`
  },
  {
    name: 'VisionB_5_DieterRams',
    code: `<div className="w-screen h-screen bg-[#EBEBEB] flex flex-col items-center justify-center font-sans text-zinc-800 p-12">
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
                <button key={p.id} onClick={() => setActiveProject(p)} className={\`w-16 h-12 rounded-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all \${activeProject.id === p.id ? 'bg-[#FF5A00] border-[#CC4800] text-white' : 'bg-[#E0E0E0] border-[#BDBDBD] text-zinc-500'} flex items-center justify-center font-medium\`}>
                  {i+1}
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>`
  },
  {
    name: 'VisionB_6_MicroUI',
    code: `<div className="w-screen h-screen bg-black flex flex-col font-sans text-white overflow-hidden relative group">
      <div className="absolute inset-4 lg:inset-8 xl:inset-12 z-0">
         <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
      </div>
      <div className="absolute bottom-0 w-full h-12 bg-black/90 backdrop-blur-md z-50 flex items-center px-12 border-t border-zinc-800 text-[10px] tracking-[0.2em] uppercase justify-between translate-y-full group-hover:translate-y-0 transition-transform duration-500">
         <div className="flex gap-12">
           <span className="text-zinc-500">FRAMES</span>
           <span>{activeProject.title} // {activeProject.client}</span>
         </div>
         <div className="flex gap-8">
            {MOCK_PROJECTS.map((p, i) => (
              <button key={p.id} onClick={() => setActiveProject(p)} className={\`transition-colors \${activeProject.id === p.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'}\`}>
                0{i+1}. {p.id}
              </button>
            ))}
         </div>
      </div>
    </div>`
  },
  {
    name: 'VisionB_7_Broadcast',
    code: `<div className="w-screen h-screen bg-black flex font-mono text-white overflow-hidden">
      <div className="flex-1 relative p-8">
        <div className="absolute inset-8 border-2 border-dashed border-zinc-800 pointer-events-none z-50"></div>
        <div className="absolute inset-20 border border-dotted border-zinc-800 pointer-events-none z-50"></div>
        <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
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
              <button key={p.id} onClick={() => setActiveProject(p)} className={\`flex items-center gap-4 p-2 border \${activeProject.id === p.id ? 'border-red-500 bg-red-500/10' : 'border-zinc-800 hover:bg-zinc-900'} text-left\`}>
                 <div className={\`w-16 h-12 bg-black border \${activeProject.id === p.id ? 'border-red-500' : 'border-zinc-800'}\`}>
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
    </div>`
  },
  {
    name: 'VisionB_8_Editorial',
    code: `<div className="w-screen h-screen bg-[#1A1A1A] flex flex-col font-sans text-white overflow-hidden p-12">
      <div className="flex justify-between items-end mb-12">
         <h1 className="text-7xl font-serif tracking-tighter leading-none">{activeProject.title}</h1>
         <div className="flex flex-col text-right font-mono text-xs text-zinc-400 uppercase tracking-widest gap-2">
            <span>Client: {activeProject.client}</span>
            <span>Role: {activeProject.role}</span>
            <span>Year: {activeProject.year}</span>
         </div>
      </div>
      <div className="flex-1 relative bg-black shadow-2xl">
         <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
      </div>
      <div className="h-40 mt-12 flex gap-8">
         {MOCK_PROJECTS.map((p, i) => (
            <button key={p.id} onClick={() => setActiveProject(p)} className={\`relative flex-1 group\`}>
               <div className="absolute inset-0 bg-black overflow-hidden">
                  <img src={p.posterUrl} className={\`w-full h-full object-cover transition-transform duration-700 \${activeProject.id === p.id ? 'scale-105 opacity-100' : 'scale-100 opacity-40 group-hover:opacity-80'}\`} />
               </div>
               <div className="absolute inset-0 p-4 flex flex-col justify-between">
                 <span className="font-mono text-[10px] uppercase text-zinc-400">0{i+1}</span>
                 <span className="font-serif text-xl opacity-0 group-hover:opacity-100 transition-opacity">{p.title}</span>
               </div>
            </button>
         ))}
      </div>
    </div>`
  },
  {
    name: 'VisionB_9_FrameIO',
    code: `<div className="w-screen h-screen bg-[#0F1115] flex flex-col font-sans text-white overflow-hidden text-sm">
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
                  <button key={p.id} onClick={() => setActiveProject(p)} className={\`flex items-center gap-3 p-2 rounded-lg transition-colors \${activeProject.id === p.id ? 'bg-[#2A2E37] text-white' : 'hover:bg-[#2A2E37]/50 text-[#8A91A1]'}\`}>
                     <div className="w-12 h-8 bg-black rounded overflow-hidden">
                        <img src={p.posterUrl} className="w-full h-full object-cover" />
                     </div>
                     <span className="font-medium truncate">{p.title}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
    </div>`
  },
  {
    name: 'VisionB_10_Brutalist',
    code: `<div className="w-screen h-screen bg-white flex flex-col font-sans text-black overflow-hidden border-[16px] border-black box-border">
      <div className="flex-1 flex relative">
         <div className="w-[70%] border-r-[16px] border-black bg-black relative">
            <FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted />
         </div>
         <div className="w-[30%] flex flex-col bg-yellow-400">
            <div className="p-8 border-b-[16px] border-black">
               <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">{activeProject.title}</h1>
               <div className="mt-8 font-bold text-xl uppercase border-t-4 border-black pt-2">{activeProject.client}</div>
            </div>
            <div className="flex-1 flex flex-col">
               {MOCK_PROJECTS.map((p, i) => (
                  <button key={p.id} onClick={() => setActiveProject(p)} className={\`flex-1 border-b-[16px] border-black last:border-b-0 flex items-center p-8 transition-transform \${activeProject.id === p.id ? 'bg-black text-white' : 'hover:bg-white text-black'}\`}>
                     <span className="text-4xl font-black">{i+1}. {p.title.toUpperCase()}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
    </div>`
  }
];

variations.forEach(v => {
  const fileContent = BASE_TEMPLATE(v.name, v.code);
  fs.writeFileSync(path.join(TARGET_DIR, v.name + '.tsx'), fileContent);
  console.log('Generated ' + v.name + '.tsx');
});
