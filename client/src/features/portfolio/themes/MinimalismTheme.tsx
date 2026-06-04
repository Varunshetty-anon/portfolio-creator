import React from 'react';
import { motion } from 'framer-motion';
import type { PortfolioData, Project } from '@/types';
import { ProjectGrid } from '../components/ProjectGrid';
import { SkillsSection } from '../components/SkillsSection';
import { VideoPlayer } from '@/components/shared/VideoPlayer';

interface MinimalismThemeProps {
  content: PortfolioData;
  projects: Project[];
  isPreviewMode: boolean;
  onProjectClick: (project: Project) => void;
  introFinished: boolean;
}

export function MinimalismTheme({
  content,
  projects,
  isPreviewMode,
  onProjectClick,
  introFinished
}: MinimalismThemeProps) {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      
      {/* Header / Bio */}
      <header className="max-w-5xl mx-auto px-8 pt-32 pb-16 lg:pt-48 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight text-text-primary max-w-3xl leading-tight mb-8">
            {content.name}.<br />
            <span className="text-text-muted">{content.role}.</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
            {content.bio}
          </p>
        </motion.div>
      </header>

      {/* Showreel */}
      {content.showreelUrl && (
        <section className="px-4 lg:px-8 max-w-7xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full aspect-[16/9] lg:aspect-[21/9] rounded-2xl overflow-hidden bg-bg-raised"
          >
            <VideoPlayer 
              url={content.showreelUrl}
              thumbnail={content.showreelThumbnailUrl}
              autoplay={introFinished}
              muted={true}
              controls={false}
              loop={true}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </section>
      )}

      {/* Projects */}
      <main className="max-w-7xl mx-auto px-8 pb-32">
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-12">Selected Works</h2>
          <ProjectGrid projects={projects} onProjectClick={onProjectClick} />
        </motion.div>

        {/* Skills */}
        <div className="mt-32">
          <SkillsSection 
            primaryTool={content.primaryTool}
            tools={content.tools}
            aiTools={content.aiTools}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-12 text-center text-sm font-medium text-text-muted">
        <p>© {new Date().getFullYear()} {content.name}</p>
        <div className="mt-4 flex justify-center gap-6">
          {content.socials?.email && <a href={`mailto:${content.socials.email}`} className="hover:text-text-primary transition-colors">Email</a>}
          {content.socials?.instagram && <a href={content.socials.instagram} target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">Instagram</a>}
          {content.socials?.twitter && <a href={content.socials.twitter} target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">Twitter</a>}
        </div>
      </footer>
    </div>
  );
}
