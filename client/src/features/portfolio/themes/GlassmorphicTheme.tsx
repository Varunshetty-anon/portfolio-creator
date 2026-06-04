import React from 'react';
import { motion } from 'framer-motion';
import type { PortfolioData, Project } from '@/types';
import { ProjectGrid } from '../components/ProjectGrid';
import { SkillsSection } from '../components/SkillsSection';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

interface GlassmorphicThemeProps {
  content: PortfolioData;
  projects: Project[];
  isPreviewMode: boolean;
  onProjectClick: (project: Project) => void;
  introFinished: boolean;
}

export function GlassmorphicTheme({
  content,
  projects,
  isPreviewMode,
  onProjectClick,
  introFinished
}: GlassmorphicThemeProps) {
  
  // Create a blurred background from the showreel or profile image
  const bgImage = content.showreelThumbnailUrl || content.profileImageUrl || '';

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans overflow-x-hidden relative">
      
      {/* Immersive Blurred Background */}
      <div className="fixed inset-0 z-0">
        {bgImage ? (
          <img src={bgImage} alt="" className="w-full h-full object-cover opacity-40 blur-3xl scale-110 saturate-150" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        
        {/* Spatial Header Card */}
        <motion.header 
          className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 lg:p-12 mb-12 flex flex-col lg:flex-row gap-12 items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {content.profileImageUrl && (
            <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-full overflow-hidden shrink-0 border-4 border-white/10 shadow-xl">
              <img src={content.profileImageUrl} alt={content.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="text-center lg:text-left flex-1">
            <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight mb-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              {content.name}
            </h1>
            <h2 className="text-lg lg:text-xl font-medium text-white/70 mb-6 tracking-wide uppercase">
              {content.role}
            </h2>
            <p className="text-white/80 leading-relaxed max-w-2xl text-sm lg:text-base">
              {content.bio}
            </p>
          </div>
        </motion.header>

        {/* Spatial Showreel Card */}
        {content.showreelUrl && (
          <motion.section 
            className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-4 mb-12 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/50">
              <FramesPlayer 
                url={content.showreelUrl}
                thumbnail={content.showreelThumbnailUrl}
                autoplay={introFinished}
                muted={true}
                controls={false}
                loop={true}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          
          {/* Main Content Area (Projects) */}
          <div className="xl:col-span-2 space-y-12">
            <motion.section 
              className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 lg:p-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-display font-bold mb-8 text-white/90">Portfolio</h3>
              {/* Note: ProjectGrid styles are global, but we can override inside this div if needed via CSS modules or targeting */}
              <div className="[&>div]:gap-6 [&>div>div]:rounded-2xl [&>div>div]:overflow-hidden [&>div>div]:border [&>div>div]:border-white/10 [&>div>div]:bg-white/5 [&>div>div]:backdrop-blur-md">
                <ProjectGrid projects={projects} onProjectClick={onProjectClick} />
              </div>
            </motion.section>
          </div>

          {/* Sidebar Area (Skills / Contact) */}
          <div className="space-y-12">
            <motion.section 
              className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 lg:p-12 h-full"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <SkillsSection 
                primaryTool={content.primaryTool}
                tools={content.tools}
                aiTools={content.aiTools}
              />

              <div className="mt-12 pt-12 border-t border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-6">Connect</h3>
                <div className="flex flex-col gap-4">
                  {content.socials?.email && (
                    <a href={`mailto:${content.socials.email}`} className="flex items-center gap-3 text-white/80 hover:text-white transition-colors p-3 rounded-xl hover:bg-white/10">
                      <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">@</span>
                      Email Me
                    </a>
                  )}
                  {content.socials?.instagram && (
                    <a href={content.socials.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors p-3 rounded-xl hover:bg-white/10">
                       <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">IG</span>
                       Instagram
                    </a>
                  )}
                </div>
              </div>
            </motion.section>
          </div>
        </div>

      </div>
    </div>
  );
}
