import React from 'react';

export default function VisionCompare() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-mono text-zinc-400 uppercase tracking-widest mb-4">
          Frames Visual Prototypes
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto">
          Compare the three design sprint executions side-by-side. 
          All three use the identical underlying data and interaction mechanics. 
          Only the visual language, typography, and structural layout differ.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full max-w-[1920px] mx-auto">
        
        {/* Vision A */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-xl font-serif">Vision A</h2>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">High-End Cinema</span>
          </div>
          <div className="relative w-full aspect-[16/10] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
            <iframe 
              src="/vision-a" 
              className="absolute inset-0 w-full h-full border-none"
              title="Vision A Prototype"
            />
          </div>
          <p className="text-sm text-zinc-500 font-serif">
            Inspired by film festivals and prestigious cinema. Serif typography, bottom billing block, physical "film still" thumbnails.
          </p>
        </div>

        {/* Vision B */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-xl font-mono">Vision B</h2>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Elite Post-Production</span>
          </div>
          <div className="relative w-full aspect-[16/10] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
            <iframe 
              src="/vision-b" 
              className="absolute inset-0 w-full h-full border-none"
              title="Vision B Prototype"
            />
          </div>
          <p className="text-sm text-zinc-500 font-mono">
            Inspired by NLE software and post houses. Pure blacks, monospaced typography, strict timeline queue structure.
          </p>
        </div>

        {/* Vision C */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-xl tracking-tighter uppercase font-bold">Vision C</h2>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Luxury Editorial</span>
          </div>
          <div className="relative w-full aspect-[16/10] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
            <iframe 
              src="/vision-c" 
              className="absolute inset-0 w-full h-full border-none"
              title="Vision C Prototype"
            />
          </div>
          <p className="text-sm text-zinc-500 uppercase tracking-tight">
            Inspired by avant-garde fashion agencies. Brutalist scale, rotated typography, overlapping floating polaroids.
          </p>
        </div>

      </div>
    </div>
  );
}
