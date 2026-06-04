// ========================
// FRAMES PortfolioLayout (Public View)
// ========================
// Main orchestrator for the public portfolio view.
// Replaces the placeholder and the old monolithic PortfolioView.tsx.

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { portfolioApi, analyticsApi } from '@/lib/api';
import type { PortfolioData, Project } from '@/types';

import { IntroOverlay } from './components/IntroOverlay';
import { ProfileSidebar } from './components/ProfileSidebar';
import { ProjectGrid } from './components/ProjectGrid';
import { ProjectModal } from './components/ProjectModal';
import { SkillsSection } from './components/SkillsSection';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export interface PortfolioLayoutProps {
  isPreviewMode?: boolean;
  draftData?: { portfolio: PortfolioData; projects: Project[] };
}

export default function PortfolioLayout({ isPreviewMode = false, draftData }: PortfolioLayoutProps) {
  const { username } = useParams<{ username: string }>();
  
  const [data, setData] = useState<{ portfolio: PortfolioData; projects: Project[] } | null>(null);
  const [isLoading, setIsLoading] = useState(!isPreviewMode);
  const [error, setError] = useState<string | null>(null);
  
  const [introFinished, setIntroFinished] = useState(isPreviewMode);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch portfolio data if not in preview mode
  useEffect(() => {
    if (isPreviewMode) {
      if (draftData) setData(draftData);
      return;
    }

    let isMounted = true;
    
    async function loadPortfolio() {
      if (!username) return;
      
      try {
        setIsLoading(true);
        const result = await portfolioApi.getPublic(username) as any;
        
        if (isMounted) {
          setData(result);
          // Track view anonymously
          if (result.portfolio?._id) {
            analyticsApi.trackView(result.portfolio._id).catch(() => {});
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Portfolio not found or not published.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPortfolio();
    return () => { isMounted = false; };
  }, [username, isPreviewMode, draftData]);

  // Track clicks on projects
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    if (data?.portfolio?._id) {
      analyticsApi.trackClick(data.portfolio._id, { 
        projectId: project._id, 
        projectTitle: project.title 
      }).catch(() => {});
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading portfolio..." />;
  }

  if (error || !data || !data.portfolio) {
    return (
      <div className="min-h-screen bg-frames-bg flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-display font-bold text-white mb-4">Portfolio Not Found</h1>
        <p className="text-zinc-400 max-w-md">{error || "This portfolio doesn't exist or hasn't been published yet."}</p>
      </div>
    );
  }

  const { portfolio, projects } = data;
  const content = portfolio.liveContent || portfolio; // Use live content if available, fallback to root

  const themeClass = content.theme && content.theme !== 'minimalism' ? `theme-${content.theme}` : '';

  return (
    <div className={`min-h-screen bg-frames-bg text-frames-text font-sans selection:bg-accent-gold/30 selection:text-white ${themeClass}`}>
      
      {/* Intro Cinematic */}
      {!isPreviewMode && (
        <IntroOverlay 
          name={content.name || username || 'Portfolio'} 
          role={content.role || 'Creator'} 
          onComplete={() => setIntroFinished(true)} 
        />
      )}

      {/* Main Content (revealed after intro or immediately if skipped) */}
      <motion.div 
        className={`flex ${isPreviewMode ? 'flex-col' : 'flex-col lg:flex-row'} min-h-screen`}
        initial={{ opacity: 0 }}
        animate={{ opacity: introFinished ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {/* Left Sidebar (Fixed on Desktop) */}
        <ProfileSidebar data={content as PortfolioData} isPreviewMode={isPreviewMode} />

        {/* Right Content Area */}
        <main className={`flex-1 ${isPreviewMode ? 'w-full' : 'lg:ml-[360px] w-full'} relative`}>
          
          {/* Showreel Section (Cinematic Hero) */}
          {content.showreelUrl ? (
            <section className="w-full h-[70vh] lg:h-screen min-h-[500px] bg-black relative overflow-hidden group">
              <motion.div
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full h-full"
              >
                <VideoPlayer 
                  url={content.showreelUrl}
                  thumbnail={content.showreelThumbnailUrl}
                  autoplay={introFinished}
                  muted={true}
                  controls={false}
                  loop={true}
                  className="w-full h-full rounded-none"
                />
              </motion.div>
              
              {/* Cinematic Vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-bg-base pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/50 pointer-events-none" />
              
              <motion.div 
                className="absolute bottom-12 left-8 right-8 lg:bottom-24 lg:left-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-accent mb-3">Showreel</h2>
                <h3 className="text-3xl lg:text-6xl font-display font-bold text-white drop-shadow-xl">
                  {content.role || 'Selected Works'}
                </h3>
              </motion.div>
            </section>
          ) : (
            <section className="w-full h-[40vh] bg-bg-raised relative flex flex-col justify-end p-8 lg:p-16 border-b border-border">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-4xl lg:text-5xl font-display font-bold text-text-primary">
                  {content.role || 'Selected Works'}
                </h3>
              </motion.div>
            </section>
          )}

          {/* Main Container */}
          <div className="px-8 lg:px-16 pb-32">
            
            {/* Projects Grid */}
            <section className="py-16 lg:py-24">
              <motion.div 
                className="flex items-end justify-between mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl lg:text-4xl font-display font-bold text-text-primary">Projects</h2>
                <span className="text-text-muted font-medium tracking-wide uppercase text-xs">{projects.length} Works</span>
              </motion.div>
              
              <ProjectGrid 
                projects={projects} 
                onProjectClick={handleProjectClick} 
              />
            </section>

            {/* Skills / Tools Section */}
            <SkillsSection 
              primaryTool={content.primaryTool}
              tools={content.tools}
              aiTools={content.aiTools}
            />
            
            {/* Footer */}
            <footer className="py-8 mt-12 border-t border-frames-border text-center flex flex-col items-center justify-center">
              <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest mb-2">
                © {new Date().getFullYear()} {content.name}
              </p>
              <a 
                href="https://frames.studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors flex items-center gap-1"
              >
                Built with <span className="text-accent-gold">FRAMES</span>
              </a>
            </footer>

          </div>
        </main>
      </motion.div>

      {/* Project Detail Modal */}
      <ProjectModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
      
    </div>
  );
}
