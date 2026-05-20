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

export default function PortfolioLayout() {
  const { username } = useParams<{ username: string }>();
  
  const [data, setData] = useState<{ portfolio: PortfolioData; projects: Project[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [introFinished, setIntroFinished] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch portfolio data
  useEffect(() => {
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
  }, [username]);

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

  return (
    <div className="min-h-screen bg-frames-bg text-frames-text font-sans selection:bg-accent-gold/30 selection:text-white">
      
      {/* Intro Cinematic */}
      <IntroOverlay 
        name={content.name || username || 'Portfolio'} 
        role={content.role || 'Creator'} 
        onComplete={() => setIntroFinished(true)} 
      />

      {/* Main Content (revealed after intro or immediately if skipped) */}
      <motion.div 
        className="flex flex-col lg:flex-row min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: introFinished ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {/* Left Sidebar (Fixed on Desktop) */}
        <ProfileSidebar data={content as PortfolioData} />

        {/* Right Content Area */}
        <main className="flex-1 lg:ml-80 w-full relative">
          
          {/* Showreel Section */}
          {content.showreelUrl && (
            <section className="w-full h-[50vh] lg:h-[70vh] min-h-[400px] bg-black relative border-b border-frames-border">
              <VideoPlayer 
                url={content.showreelUrl}
                thumbnail={content.showreelThumbnailUrl}
                autoplay={introFinished}
                muted={true}
                controls={false}
                loop={true}
                className="w-full h-full rounded-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-frames-bg via-transparent to-transparent opacity-80 pointer-events-none" />
              
              <div className="absolute bottom-8 left-8 right-8 lg:bottom-12 lg:left-12">
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-accent-gold mb-2">Showreel</h2>
                <h3 className="text-2xl lg:text-4xl font-display font-bold text-white">Selected Works</h3>
              </div>
            </section>
          )}

          {/* Spacer if no showreel */}
          {!content.showreelUrl && <div className="h-12 lg:h-24"></div>}

          {/* Main Container */}
          <div className="px-6 lg:px-12 pb-24">
            
            {/* Projects Grid */}
            <section className="py-12">
              <div className="flex items-end justify-between mb-10">
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-white">Projects</h2>
                <span className="text-zinc-500 font-medium">{projects.length} Works</span>
              </div>
              
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
