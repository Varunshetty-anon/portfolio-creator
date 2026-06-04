import React from 'react';
import { motion } from 'framer-motion';
import type { PortfolioData, Project } from '@/types';
import { ProjectGrid } from '../components/ProjectGrid';
import { SkillsSection } from '../components/SkillsSection';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

interface MagazineThemeProps {
  content: PortfolioData;
  projects: Project[];
  isPreviewMode: boolean;
  onProjectClick: (project: Project) => void;
  introFinished: boolean;
}

export function MagazineTheme({
  content,
  projects,
  isPreviewMode,
  onProjectClick,
  introFinished
}: MagazineThemeProps) {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-serif">
      
      {/* Magazine Masthead */}
      <header className="border-b-4 border-text-primary py-8 px-6 lg:px-12 flex flex-col items-center">
        <h1 className="text-6xl lg:text-9xl font-black uppercase tracking-tighter text-text-primary text-center">
          {content.name}
        </h1>
        <div className="w-full flex justify-between items-center mt-6 uppercase text-xs font-sans tracking-widest font-bold border-t border-b border-border py-3">
          <span>Vol. 1</span>
          <span>{content.role}</span>
          <span>{content.location || 'Worldwide'}</span>
        </div>
      </header>

      {/* Editorial Hero Layout */}
      <main className="px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-24">
          {/* Bio Column */}
          <div className="lg:col-span-4">
            <h2 className="text-xl font-bold uppercase mb-6 font-sans tracking-widest border-b border-border pb-4">Editor's Note</h2>
            <p className="text-lg lg:text-xl leading-relaxed text-text-primary/90 font-serif first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-[-0.1em]">
              {content.bio}
            </p>
          </div>

          {/* Showreel Column */}
          <div className="lg:col-span-8">
            {content.showreelUrl ? (
              <div className="w-full aspect-[4/3] bg-bg-raised overflow-hidden">
                <FramesPlayer 
                  url={content.showreelUrl}
                  thumbnail={content.showreelThumbnailUrl}
                  autoplay={introFinished}
                  muted={true}
                  controls={false}
                  loop={true}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-text-primary text-bg-base flex items-center justify-center p-12">
                <h3 className="text-4xl font-bold uppercase text-center leading-none">Visual<br/>Story<br/>Telling</h3>
              </div>
            )}
            <p className="text-right text-xs uppercase font-sans tracking-widest font-bold mt-4 text-text-muted">Focus / Featured Showreel</p>
          </div>
        </div>

        {/* Projects Gallery */}
        <section className="border-t-2 border-text-primary pt-16">
          <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-16 text-center">Exhibition</h2>
          <ProjectGrid projects={projects} onProjectClick={onProjectClick} />
        </section>
        
        {/* Skills / Tools */}
        <div className="mt-24 border-t border-border pt-16 font-sans">
          <SkillsSection 
            primaryTool={content.primaryTool}
            tools={content.tools}
            aiTools={content.aiTools}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-text-primary text-bg-base py-16 px-6 lg:px-12 flex flex-col lg:flex-row justify-between items-center font-sans font-bold uppercase tracking-widest text-xs">
        <span>© {new Date().getFullYear()}</span>
        <div className="flex gap-8 mt-6 lg:mt-0">
          {content.socials?.email && <a href={`mailto:${content.socials.email}`} className="hover:opacity-70">Email</a>}
          {content.socials?.instagram && <a href={content.socials.instagram} target="_blank" rel="noreferrer" className="hover:opacity-70">IG</a>}
        </div>
      </footer>
    </div>
  );
}
