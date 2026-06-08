import React from 'react';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

export default function AuditMedia() {
  const vimeoUrl = "https://vimeo.com/76979871"; 
  const youtubeUrl = "https://www.youtube.com/watch?v=Jm-upHSP9KU"; 
  const driveUrl = "https://drive.google.com/file/d/1_T_P_1BszX0c4t9P-_b5uA3Z5Z5Z5Z5Z/view"; 
  const mp4Url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; 
  const errorUrl = "https://example.com/broken.mp4";

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans">
      <h1 className="text-3xl mb-10 font-bold border-b border-white/20 pb-4">Video Reliability Audit</h1>
      
      <div className="grid grid-cols-2 gap-10 mb-20" id="video-audit">
        <div>
          <h2 className="text-sm font-mono mb-2 text-white/50">Vimeo</h2>
          <div className="w-full aspect-video border border-white/10" id="player-vimeo">
            <FramesPlayer url={vimeoUrl} controls={true} autoplay={false} muted={true} />
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-mono mb-2 text-white/50">YouTube</h2>
          <div className="w-full aspect-video border border-white/10" id="player-youtube">
            <FramesPlayer url={youtubeUrl} controls={true} autoplay={false} muted={true} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-mono mb-2 text-white/50">Google Drive</h2>
          <div className="w-full aspect-video border border-white/10" id="player-drive">
            <FramesPlayer url={driveUrl} controls={true} autoplay={false} muted={true} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-mono mb-2 text-white/50">Uploaded MP4</h2>
          <div className="w-full aspect-video border border-white/10" id="player-mp4">
            <FramesPlayer url={mp4Url} controls={true} autoplay={false} muted={true} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-mono mb-2 text-white/50">Error State</h2>
          <div className="w-full aspect-video border border-white/10" id="player-error">
            <FramesPlayer url={errorUrl} controls={true} autoplay={false} muted={true} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-mono mb-2 text-white/50">Loading State (Simulated)</h2>
          <div className="w-full aspect-video border border-white/10 relative overflow-hidden bg-black flex items-center justify-center" id="player-loading">
            <div className="w-8 h-8 border-[1.5px] border-white/70 animate-spin" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl mb-10 font-bold border-b border-white/20 pb-4">Presentation Strategies Audit</h1>

      {/* STRATEGY A: BACKGROUND VIDEO */}
      <h2 className="text-sm font-mono mb-4 text-white/50">Strategy A: Background Video</h2>
      <div className="relative w-full h-[600px] border border-white/20 mb-20 overflow-hidden flex flex-col justify-end p-10" id="strategy-a">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <FramesPlayer url={mp4Url} controls={false} autoplay={true} muted={true} loop={true} />
        </div>
        <div className="relative z-10">
          <h1 className="text-8xl font-black uppercase leading-none tracking-tighter">Jane Doe</h1>
          <p className="mt-4 text-white/50 max-w-md">Director and Cinematographer based in Los Angeles. Crafting visually driven stories.</p>
        </div>
      </div>

      {/* STRATEGY B: DEDICATED PANEL */}
      <h2 className="text-sm font-mono mb-4 text-white/50">Strategy B: Dedicated Video Panel</h2>
      <div className="relative w-full h-[600px] border border-white/20 mb-20 flex flex-col items-center justify-center px-10" id="strategy-b">
        <div className="w-full max-w-5xl flex gap-10 items-center">
          <div className="flex-1">
            <h1 className="text-7xl font-black uppercase leading-[0.9] tracking-tighter mb-4">Jane Doe</h1>
            <p className="text-white/50">Director and Cinematographer based in Los Angeles. Crafting visually driven stories.</p>
          </div>
          <div className="flex-1 aspect-video relative rounded-lg overflow-hidden border border-white/10 shadow-2xl">
            <FramesPlayer url={mp4Url} controls={false} autoplay={true} muted={true} loop={true} />
          </div>
        </div>
      </div>

      {/* STRATEGY C: POSTER FRAME + PLAY INTERACTION */}
      <h2 className="text-sm font-mono mb-4 text-white/50">Strategy C: Poster Frame + Play Interaction</h2>
      <div className="relative w-full h-[600px] border border-white/20 mb-20 flex flex-col justify-center px-10" id="strategy-c">
        <div className="w-full max-w-6xl mx-auto relative group cursor-pointer aspect-video border border-white/10 overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-80" alt="Poster" />
          </div>
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
             <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:scale-105 transition-transform">
               <svg className="w-8 h-8 ml-2 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
             </div>
          </div>
          <div className="absolute bottom-10 left-10 z-20 pointer-events-none">
            <h1 className="text-6xl font-black uppercase leading-none tracking-tighter shadow-black drop-shadow-md">Jane Doe</h1>
            <p className="mt-2 text-white shadow-black drop-shadow-md">Play Showreel</p>
          </div>
        </div>
      </div>

      {/* STRATEGY D: MOTION PREVIEW */}
      <h2 className="text-sm font-mono mb-4 text-white/50">Strategy D: Motion Preview</h2>
      <div className="relative w-full h-[600px] border border-white/20 mb-20 flex flex-col justify-center px-10" id="strategy-d">
        <div className="w-full max-w-6xl mx-auto relative group cursor-pointer aspect-video border border-white/10 overflow-hidden">
          <div className="absolute inset-0 z-0 scale-105 group-hover:scale-100 transition-transform duration-1000">
             <FramesPlayer url={mp4Url} controls={false} autoplay={true} muted={true} loop={true} />
          </div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute bottom-10 left-10 z-20 pointer-events-none transition-transform duration-500 group-hover:translate-y-[-10px]">
            <h1 className="text-6xl font-black uppercase leading-none tracking-tighter">Jane Doe</h1>
            <p className="mt-2 text-white/70">Hover to play preview. Click for full showreel.</p>
          </div>
        </div>
      </div>

      {/* STRATEGY E: INTRO SEQUENCE */}
      <h2 className="text-sm font-mono mb-4 text-white/50">Strategy E: Premium Intro Sequence</h2>
      <div className="relative w-full h-[600px] border border-white/20 mb-20 flex flex-col items-center justify-center bg-black overflow-hidden" id="strategy-e">
        <div className="flex flex-col items-center animate-pulse">
           <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" className="w-24 h-24 rounded-full object-cover mb-6 border border-white/20" alt="Profile" />
           <h1 className="text-4xl font-black uppercase tracking-widest mb-2">Jane Doe</h1>
           <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Director</p>
        </div>
      </div>

    </div>
  );
}
