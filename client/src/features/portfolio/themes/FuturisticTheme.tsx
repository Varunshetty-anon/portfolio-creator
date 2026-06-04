import React from 'react';
import { motion } from 'framer-motion';
import type { PortfolioData, Project } from '@/types';
import { ProjectGrid } from '../components/ProjectGrid';
import { SkillsSection } from '../components/SkillsSection';
import { VideoPlayer } from '@/components/shared/VideoPlayer';

interface FuturisticThemeProps {
  content: PortfolioData;
  projects: Project[];
  isPreviewMode: boolean;
  onProjectClick: (project: Project) => void;
  introFinished: boolean;
}

export function FuturisticTheme({
  content,
  projects,
  isPreviewMode,
  onProjectClick,
  introFinished
}: FuturisticThemeProps) {
  return (
    <div className="min-h-screen bg-black text-[#00FF9D] font-mono selection:bg-[#00FF9D] selection:text-black">
      
      {/* Tech Grid Background overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      
      {/* Nav Overlay */}
      <nav className="fixed top-0 left-0 right-0 p-4 lg:p-8 flex justify-between items-start z-10 mix-blend-difference pointer-events-none">
        <div className="text-xs uppercase tracking-[0.3em] opacity-70">
          SYS.ID: {content.name.replace(/\s+/g, '_').toUpperCase()}
          <br/>
          STS: ACTIVE
        </div>
        <div className="text-xs uppercase tracking-[0.3em] opacity-70 text-right">
          {new Date().toISOString().split('T')[0]}
          <br/>
          LOC: {content.location || 'UNKNOWN'}
        </div>
      </nav>

      <main className="relative z-0 pt-24 lg:pt-32 px-4 lg:px-12 pb-32">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32 border border-[#00FF9D]/20 p-8 lg:p-12 relative bg-black/50 backdrop-blur-sm">
          {/* Decorative Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00FF9D]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00FF9D]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00FF9D]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00FF9D]" />
          
          <div>
            <h1 className="text-4xl lg:text-7xl font-bold uppercase tracking-tighter mb-4 text-white drop-shadow-[0_0_15px_rgba(0,255,157,0.5)]">
              {content.name}
            </h1>
            <h2 className="text-xl lg:text-2xl uppercase tracking-widest text-[#00FF9D] mb-8 font-bold border-b border-[#00FF9D]/30 pb-4 inline-block">
              // {content.role}
            </h2>
            <p className="text-sm lg:text-base leading-relaxed text-zinc-400 max-w-lg">
              {content.bio}
            </p>
          </div>
          
          <div className="relative group">
            {content.showreelUrl ? (
              <div className="w-full aspect-video border border-[#00FF9D]/30 relative overflow-hidden bg-zinc-900">
                <VideoPlayer 
                  url={content.showreelUrl}
                  thumbnail={content.showreelThumbnailUrl}
                  autoplay={introFinished}
                  muted={true}
                  controls={false}
                  loop={true}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-[#00FF9D]/10 pointer-events-none mix-blend-overlay" />
                
                {/* Crosshairs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-[#00FF9D]/50 rounded-full flex items-center justify-center pointer-events-none">
                  <div className="w-1 h-1 bg-[#00FF9D]" />
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video border border-[#00FF9D]/30 flex flex-col items-center justify-center bg-black">
                <span className="text-[#00FF9D] animate-pulse">NO_SIGNAL</span>
              </div>
            )}
          </div>
        </div>

        {/* Database (Projects) */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <h3 className="text-2xl font-bold uppercase tracking-widest text-white">_Project_Archive</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[#00FF9D]/50 to-transparent" />
          </div>
          <div className="[&>div]:gap-2 [&>div>div]:border [&>div>div]:border-[#00FF9D]/20 [&>div>div]:bg-zinc-950">
            <ProjectGrid projects={projects} onProjectClick={onProjectClick} />
          </div>
        </section>

        {/* Specs (Skills) */}
        <section className="border border-[#00FF9D]/20 p-8 lg:p-12 relative bg-black/50 backdrop-blur-sm">
           <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-8 border-b border-[#00FF9D]/20 pb-4 inline-block">
             _System_Specs
           </h3>
           <SkillsSection 
            primaryTool={content.primaryTool}
            tools={content.tools}
            aiTools={content.aiTools}
          />
        </section>

      </main>
      
      <footer className="border-t border-[#00FF9D]/20 p-4 text-center text-xs text-[#00FF9D]/50 uppercase tracking-widest">
        SYSTEM_TERMINAL © {new Date().getFullYear()} // END OF LINE
      </footer>
    </div>
  );
}
