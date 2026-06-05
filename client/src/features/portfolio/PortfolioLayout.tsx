import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { portfolioApi } from '@/lib/api';
import { PortfolioData } from '@/types';
import { IntroOverlay } from './components/IntroOverlay';
import { ProjectModal } from './components/ProjectModal';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

interface PortfolioLayoutProps {
  isPreviewMode?: boolean;
  draftData?: PortfolioData | null;
}

export default function PortfolioLayout({ isPreviewMode = false, draftData = null }: PortfolioLayoutProps) {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(!isPreviewMode);
  const [introComplete, setIntroComplete] = useState(isPreviewMode);
  
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (isPreviewMode && draftData) {
      setData(draftData);
      setLoading(false);
      return;
    }

    if (username) {
      portfolioApi.getPortfolio(username)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          navigate('/404');
        });
    }
  }, [username, isPreviewMode, draftData, navigate]);

  // Sync draft data updates in preview mode
  useEffect(() => {
    if (isPreviewMode && draftData) {
      setData(draftData);
    }
  }, [draftData, isPreviewMode]);

  if (loading || !data) return null;

  const { portfolio, projects } = data;
  const hoveredProject = projects.find(p => p.id === hoveredProjectId);

  return (
    <div className="relative min-h-screen bg-bg-base text-text-primary overflow-hidden selection:bg-white selection:text-black">
      {/* Intro Overlay */}
      {!introComplete && (
        <IntroOverlay 
          name={portfolio.name || 'Creative'} 
          role={portfolio.role || 'Portfolio'} 
          onComplete={() => setIntroComplete(true)} 
        />
      )}

      {/* Global Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-black">
        <AnimatePresence>
          {hoveredProject?.videoUrl && (
            <motion.div
              key={hoveredProject.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.4, scale: 1 }} // 40% opacity so text is still perfectly readable
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 object-cover"
            >
              <div className="w-full h-full scale-[1.5]"> {/* Overscale to hide player UI if any */}
                <FramesPlayer 
                  url={hoveredProject.videoUrl} 
                  controls={false} 
                  autoplay={true} 
                  muted={true} 
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Persistent Grain */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col h-screen overflow-y-auto overflow-x-hidden no-scrollbar">
        
        {/* Massive Hero Section */}
        <header className="w-full min-h-[85vh] flex flex-col justify-end px-6 md:px-16 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 40 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display font-bold uppercase tracking-tighter text-[12vw] leading-[0.85] text-white">
              {portfolio.name}
            </h1>
            <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-white/20 pt-8">
              <div className="max-w-xl">
                <p className="text-xl md:text-2xl text-text-muted font-light leading-relaxed">
                  {portfolio.bio}
                </p>
              </div>
              <div className="flex flex-col text-sm tracking-widest uppercase text-text-muted space-y-2 text-left md:text-right">
                <span className="text-white font-medium">{portfolio.role}</span>
                {portfolio.location && <span>{portfolio.location}</span>}
                {portfolio.languages && <span>{portfolio.languages}</span>}
                <div className="pt-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white text-xs backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Available for Work
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* The Cinematic Index */}
        <main className="w-full px-6 md:px-16 pb-32">
          <ul className="w-full border-t border-white/20 group/list">
            {projects.map((project, index) => (
              <motion.li 
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
                onClick={() => setSelectedProjectId(project.id)}
                className="group relative flex items-center justify-between py-8 md:py-12 border-b border-white/10 cursor-pointer transition-colors duration-500 hover:border-white/40"
              >
                <div className="flex items-center gap-8 md:gap-16">
                  <span className="text-sm md:text-base font-mono text-white/30 group-hover:text-white/60 transition-colors duration-500">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <h2 className="font-display font-bold uppercase tracking-tight text-4xl md:text-7xl text-white/40 group-hover:text-white transition-all duration-500 group-hover:translate-x-4">
                    {project.title}
                  </h2>
                </div>
                <div className="hidden md:flex items-center gap-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-sm tracking-widest uppercase text-white/60">
                    {project.contentType}
                  </span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-500">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.li>
            ))}
          </ul>
        </main>

      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProjectId && (
          <ProjectModal
            project={projects.find(p => p.id === selectedProjectId)!}
            onClose={() => setSelectedProjectId(null)}
            portfolioName={portfolio.name || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
