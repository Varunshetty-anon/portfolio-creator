// ========================
// FRAMES PortfolioLayout (Public View)
// ========================
// Main orchestrator for the public portfolio view.
// Uses the single flagship FRAMES design language.

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioApi, analyticsApi } from '@/lib/api';
import type { PortfolioData, Project } from '@/types';

import { IntroOverlay } from './components/IntroOverlay';
import { ProjectModal } from './components/ProjectModal';
import { ProfileSidebar } from './components/ProfileSidebar';
import { ProjectGrid } from './components/ProjectGrid';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

export interface PortfolioLayoutProps {
  isPreviewMode?: boolean;
  draftData?: { portfolio: PortfolioData; projects: Project[] };
}

export default function PortfolioLayout({ isPreviewMode = false, draftData }: PortfolioLayoutProps) {
  const { username } = useParams<{ username: string }>();
  
  const [fetchedData, setFetchedData] = useState<{ portfolio: PortfolioData; projects: Project[] } | null>(null);
  const [isLoading, setIsLoading] = useState(!isPreviewMode);
  const [error, setError] = useState<string | null>(null);
  
  const [introFinished, setIntroFinished] = useState(isPreviewMode);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const data = isPreviewMode ? draftData ?? null : fetchedData;

  useEffect(() => {
    if (isPreviewMode) return;

    let isMounted = true;
    
    async function loadPortfolio() {
      if (!username) return;
      
      try {
        setIsLoading(true);
        const result = await portfolioApi.getPublic(username) as any;
        
        if (isMounted) {
          setFetchedData(result);
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
  }, [username, isPreviewMode]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    if (data?.portfolio?._id && !isPreviewMode) {
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
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-4">Portfolio Not Found</h1>
        <p className="text-text-muted max-w-md">{error || "This portfolio doesn't exist or hasn't been published yet."}</p>
      </div>
    );
  }

  const { portfolio, projects } = data;
  const content = (portfolio.liveContent || portfolio) as PortfolioData;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-body selection:bg-white/10 selection:text-white">
      {/* Intro Cinematic */}
      {!isPreviewMode && !introFinished && (
        <IntroOverlay 
          name={content.name || username || 'Portfolio'} 
          role={content.role || 'Creator'} 
          onComplete={() => setIntroFinished(true)} 
        />
      )}

      {/* Main Layout */}
      <div className={`transition-opacity duration-1000 ${introFinished ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col lg:flex-row min-h-screen">
          
          {/* Fixed Sidebar Component */}
          <ProfileSidebar data={content} isPreviewMode={isPreviewMode} />

          {/* Main Content Area */}
          <main className="flex-1 lg:ml-[360px] xl:ml-[400px] min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-8 lg:p-12 xl:p-16">
              
              {/* Showreel Section */}
              {content.showreelUrl && (
                <section className="mb-16 sm:mb-24">
                  <header className="mb-6">
                    <h2 className="text-[11px] font-display font-bold tracking-[0.2em] text-text-subtle uppercase">Showreel</h2>
                  </header>
                  <div className="rounded-none overflow-hidden bg-bg-raised shadow-2xl border border-border">
                    <FramesPlayer
                      url={content.showreelUrl}
                      thumbnail={content.showreelThumbnailUrl}
                      aspectRatio="16:9"
                    />
                  </div>
                </section>
              )}

              {/* Projects Grid Section */}
              {projects.length > 0 && (
                <section>
                  <header className="mb-8">
                    <h2 className="text-[11px] font-display font-bold tracking-[0.2em] text-text-subtle uppercase">Selected Work</h2>
                  </header>
                  <ProjectGrid projects={projects} onProjectClick={handleProjectClick} />
                </section>
              )}

              {/* Empty State */}
              {projects.length === 0 && !content.showreelUrl && (
                <div className="py-32 text-center">
                  <p className="text-text-muted">No projects available to display.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Global Project Detail Modal */}
      <ProjectModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </div>
  );
}
