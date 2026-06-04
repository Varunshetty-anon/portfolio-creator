// ========================
// FRAMES PortfolioLayout (Public View)
// ========================
// Main orchestrator for the public portfolio view.
// Acts as a Theme Router to conditionally render the active theme.

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioApi, analyticsApi } from '@/lib/api';
import type { PortfolioData, Project } from '@/types';

import { IntroOverlay } from './components/IntroOverlay';
import { ProjectModal } from './components/ProjectModal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Themes
import { MinimalismTheme } from './themes/MinimalismTheme';
import { MagazineTheme } from './themes/MagazineTheme';
import { FuturisticTheme } from './themes/FuturisticTheme';
import { GlassmorphicTheme } from './themes/GlassmorphicTheme';

export interface PortfolioLayoutProps {
  isPreviewMode?: boolean;
  draftData?: { portfolio: PortfolioData; projects: Project[] };
}

export default function PortfolioLayout({ isPreviewMode = false, draftData }: PortfolioLayoutProps) {
  const { username } = useParams<{ username: string }>();
  
  // Only used for public (non-preview) mode
  const [fetchedData, setFetchedData] = useState<{ portfolio: PortfolioData; projects: Project[] } | null>(null);
  const [isLoading, setIsLoading] = useState(!isPreviewMode);
  const [error, setError] = useState<string | null>(null);
  
  const [introFinished, setIntroFinished] = useState(isPreviewMode);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // In preview mode, use draftData directly (no state copy = no re-render cascade)
  // In public mode, use fetched data
  const data = isPreviewMode ? draftData ?? null : fetchedData;

  // Fetch portfolio data only in public mode
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
  }, [username, isPreviewMode]);

  // Track clicks on projects
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
  const content = portfolio.liveContent || portfolio; // Use live content if available, fallback to draft
  const activeTheme = content.theme || 'minimalism';

  // Render the selected theme
  const renderTheme = () => {
    const props = {
      content: content as PortfolioData,
      projects,
      isPreviewMode,
      onProjectClick: handleProjectClick,
      introFinished,
    };

    switch (activeTheme) {
      case 'magazine':
        return <MagazineTheme {...props} />;
      case 'futuristic':
        return <FuturisticTheme {...props} />;
      case 'glassmorphic':
        return <GlassmorphicTheme {...props} />;
      case 'minimalism':
      default:
        return <MinimalismTheme {...props} />;
    }
  };

  return (
    <>
      {/* Intro Cinematic (Only on live site, skips on preview) */}
      {!isPreviewMode && !introFinished && (
        <IntroOverlay 
          name={content.name || username || 'Portfolio'} 
          role={content.role || 'Creator'} 
          onComplete={() => setIntroFinished(true)} 
        />
      )}

      {/* Main Theme Render */}
      {renderTheme()}

      {/* Global Project Detail Modal */}
      <ProjectModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </>
  );
}

