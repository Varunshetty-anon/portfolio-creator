import React from 'react';

const visions = [
  { id: '1', name: 'VisionB_1_NLE', label: 'NLE Default', tier: 'Tier B' },
  { id: '2', name: 'VisionB_2_CameraOS', label: 'Camera OS', tier: 'Tier A' },
  { id: '3', name: 'VisionB_3_SwissGrid', label: 'Swiss Grid', tier: 'Tier A' },
  { id: '4', name: 'VisionB_4_Terminal', label: 'Terminal', tier: 'Tier B' },
  { id: '5', name: 'VisionB_5_DieterRams', label: 'Dieter Rams', tier: 'Tier A' },
  { id: '6', name: 'VisionB_6_MicroUI', label: 'Micro-UI', tier: 'Tier A' },
  { id: '7', name: 'VisionB_7_Broadcast', label: 'Broadcast Monitor', tier: 'Tier B' },
  { id: '8', name: 'VisionB_8_Editorial', label: 'Editorial Collision', tier: 'Tier A' },
  { id: '9', name: 'VisionB_9_FrameIO', label: 'Frame.io Modernist', tier: 'Tier B' },
  { id: '10', name: 'VisionB_10_Brutalist', label: 'Brutalist Editor', tier: 'Tier B' }
];

export default function Vision10Compare() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-mono text-white uppercase tracking-widest mb-4">
          Visual Execution Sprint
        </h1>
        <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
          10 radically different visual executions of the "Master Timeline" architecture.
          Every execution shares identical interaction mechanics and content.
          The objective is to discover a proprietary FRAMES visual language.
        </p>
      </header>

      {/* Tier A */}
      <div className="mb-24">
        <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-4">
           <h2 className="text-2xl font-bold tracking-tight text-white">Tier A</h2>
           <span className="text-sm text-green-400 font-mono bg-green-400/10 px-3 py-1 rounded">Highest Potential</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 w-full max-w-[2400px] mx-auto">
          {visions.filter(v => v.tier === 'Tier A').map(v => (
            <div key={v.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium">{v.label}</h3>
                <a href={\`/vision-b-${v.id}\`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300">Open Fullscreen ↗</a>
              </div>
              <div className="relative w-full aspect-[16/10] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
                <iframe 
                  src={\`/vision-b-${v.id}\`} 
                  className="absolute inset-0 w-full h-full border-none"
                  title={v.label}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier B */}
      <div>
        <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-4">
           <h2 className="text-2xl font-bold tracking-tight text-white">Tier B</h2>
           <span className="text-sm text-zinc-400 font-mono bg-zinc-800 px-3 py-1 rounded">Reference Exploration</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 w-full max-w-[2400px] mx-auto">
          {visions.filter(v => v.tier === 'Tier B').map(v => (
            <div key={v.id} className="flex flex-col gap-4 opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium">{v.label}</h3>
                <a href={\`/vision-b-${v.id}\`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300">Open Fullscreen ↗</a>
              </div>
              <div className="relative w-full aspect-[16/10] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shadow-xl">
                <iframe 
                  src={\`/vision-b-${v.id}\`} 
                  className="absolute inset-0 w-full h-full border-none pointer-events-none"
                  title={v.label}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
