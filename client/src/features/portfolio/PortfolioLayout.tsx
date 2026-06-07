import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Mail, ArrowUpRight, X } from 'lucide-react';
import { portfolioApi } from '@/lib/api';
import type { PortfolioData, Project } from '@/types';
import { FramesPlayer } from '@/components/shared/FramesPlayer';
import { ToolIcon } from '@/components/shared/ToolIcon';
import { IntroOverlay } from './components/IntroOverlay';

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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isPreviewMode && draftData) {
      setData(draftData);
      setLoading(false);
      return;
    }

    if (username) {
      portfolioApi.getPublic(username)
        .then((res: any) => {
          if (res.portfolio) {
            setData({ ...res.portfolio, projects: res.projects });
          } else {
            setData(res);
          }
          setLoading(false);
        })
        .catch((err: any) => {
          console.error(err);
          navigate('/404');
        });
    }
  }, [username, isPreviewMode, draftData, navigate]);

  useEffect(() => {
    if (isPreviewMode && draftData) {
      setData(draftData);
    }
  }, [draftData, isPreviewMode]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading || !data) return null;

  const projects = [...(data.projects || [])].sort((a, b) => a.order - b.order);
  const heroVideoUrl = data.showreelUrl || (projects[0]?.videoUrl);

  const truncate = (str: string, length: number) => {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20">
      {!introComplete && !isPreviewMode && (
        <IntroOverlay
          name={data.name || 'Creative'}
          role={data.role || 'Portfolio'}
          onComplete={() => setIntroComplete(true)}
        />
      )}

      {/* FIXED NAVBAR */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-40 h-[52px] flex items-center justify-between px-6 md:px-10 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/[0.06]' : 'bg-transparent border-transparent'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
            <path d="M4 8V4h4" />
            <path d="M20 8V4h-4" />
            <path d="M4 16v4h4" />
            <path d="M20 16v4h-4" />
          </svg>
          <span className="font-mono text-[11px] tracking-[0.2em] text-white/40">FRAMES</span>
        </div>
        <div className="flex items-center">
          <span className="font-mono text-xs text-white/50 mr-4">{data.name}</span>
          <div className="flex items-center gap-3">
            {data.socials?.instagram && (
              <a href={data.socials.instagram} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">
                <Instagram size={16} />
              </a>
            )}
            {(data.socials?.email || data.contactEmail) && (
              <a href={`mailto:${data.contactEmail || data.socials?.email}`} className="text-white/40 hover:text-white transition-colors">
                <Mail size={16} />
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[100dvh] overflow-hidden flex flex-col justify-end px-6 pb-20 md:px-14 md:pb-24 pt-20">
        <div className="absolute inset-0 z-0">
          {heroVideoUrl && (
            <div className="w-full h-full opacity-30 scale-[1.1]">
              <FramesPlayer url={heroVideoUrl} controls={false} autoplay={true} muted={true} loop={true} />
            </div>
          )}
          <div 
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #050505 0%, #050505 20%, rgba(5,5,5,0.7) 60%, rgba(5,5,5,0.3) 100%)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto">
          {/* ROW 1 */}
          <div className="mb-6 w-full">
            <h1 
              className="font-display font-black uppercase tracking-tighter text-white"
              style={{ fontSize: 'clamp(52px, 9vw, 130px)', lineHeight: 0.88 }}
            >
              {data.name}
            </h1>
          </div>

          <div className="w-full border-t border-white/10 my-6" />

          {/* ROW 2 */}
          <div className="flex justify-between items-start flex-col md:flex-row gap-8">
            <p className="max-w-[420px] font-light text-base md:text-lg text-white/45 leading-[1.7]">
              {data.bio}
            </p>
            
            <div className="md:text-right flex flex-col gap-1 md:items-end w-full md:w-auto text-left">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#C0A36E]">
                {data.role}
              </div>
              {data.location && (
                <div className="font-mono text-[11px] text-white/25 uppercase">
                  {data.location}
                </div>
              )}
              {data.availability?.status && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 border border-white/10 self-start md:self-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">Available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WORK GRID */}
      {projects.length > 0 && (
        <section className="w-full p-0 m-0">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/25 px-6 md:px-10 mb-4 mt-16 max-w-[1600px] mx-auto">
            WORK
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[3px] w-full">
            {projects.map((project) => (
              <div
                key={project._id || project.id}
                className="group relative overflow-hidden cursor-pointer bg-[#111]"
                style={{ aspectRatio: '16/9' }}
                onClick={() => setSelectedProject(project)}
              >
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-[#1a1a1a]" />
                )}
                
                <div 
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 65%, transparent 100%)' }}
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-none">
                  {project.contentType && (
                    <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-white/45 border border-white/15 px-1.5 py-0.5 inline-block mb-2">
                      {project.contentType}
                    </span>
                  )}
                  <h3 className="font-display font-bold text-white leading-[1.2] line-clamp-2" style={{ fontSize: 'clamp(16px, 2vw, 22px)' }}>
                    {project.title}
                  </h3>
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <ArrowUpRight size={16} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SKILLS SECTION */}
      {data.tools && data.tools.length > 0 && (
        <section className="w-full px-6 py-16 md:px-14 md:py-16 border-t border-white/[0.06] mt-16 max-w-[1600px] mx-auto">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/25 mb-8">
            SKILLS
          </div>
          <div className="flex flex-wrap gap-[10px]">
            {data.tools.map(tool => (
              <div key={tool} className="border border-white/10 hover:border-white/25 transition-colors duration-200 px-3 py-2 flex items-center gap-2">
                <ToolIcon name={tool} size={14} className="opacity-50" />
                <span className="font-mono text-xs text-white/50">{tool}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CONTACT SECTION */}
      <section className="w-full px-6 py-20 md:px-14 md:py-24 border-t border-white/[0.06] max-w-[1600px] mx-auto">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/20 mb-8">
          CONTACT
        </div>
        <h2 
          onClick={() => setContactOpen(true)}
          className="font-display font-black uppercase tracking-tighter text-white cursor-pointer hover:text-[#C0A36E] transition-colors duration-300 w-fit"
          style={{ fontSize: 'clamp(48px, 9vw, 130px)' }}
        >
          LET'S TALK
        </h2>
        <div className="text-center font-mono text-[9px] tracking-[0.18em] uppercase text-white/12 pt-12">
          BUILT WITH FRAMES
        </div>
      </section>

      {/* CONTACT DRAWER */}
      <AnimatePresence>
        {contactOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContactOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/[0.08] p-10 md:p-8"
            >
              <button 
                onClick={() => setContactOpen(false)}
                className="absolute top-4 right-6 font-mono text-xs text-white/40 hover:text-white cursor-pointer"
              >
                ✕ CLOSE
              </button>
              
              <h3 className="font-display text-2xl font-bold text-white mb-2">REACH OUT</h3>
              <p className="font-mono text-xs text-[#C0A36E] tracking-[0.15em] uppercase mb-8">
                Available for {data.role}
              </p>

              <div className="flex flex-wrap gap-3">
                {data.socials?.instagram && (
                  <a href={data.socials.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-4 py-3 border border-white/10 hover:border-white/30 transition duration-200 font-mono text-sm text-white/70">
                    <Instagram size={16} />
                    <span>Instagram</span>
                  </a>
                )}
                {data.socials?.linkedin && (
                  <a href={data.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-4 py-3 border border-white/10 hover:border-white/30 transition duration-200 font-mono text-sm text-white/70">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    <span>LinkedIn</span>
                  </a>
                )}
                {data.socials?.discord && (
                  <a href={data.socials.discord} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-4 py-3 border border-white/10 hover:border-white/30 transition duration-200 font-mono text-sm text-white/70">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    <span>Discord</span>
                  </a>
                )}
                {(data.socials?.email || data.contactEmail) && (
                  <a href={`mailto:${data.contactEmail || data.socials?.email}`} className="flex items-center gap-2.5 px-4 py-3 border border-white/10 hover:border-white/30 transition duration-200 font-mono text-sm text-white/70">
                    <Mail size={16} />
                    <span>{data.socials?.email || data.contactEmail}</span>
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PROJECT MODAL */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 z-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full h-[100dvh] md:w-[calc(100vw-32px)] md:h-[calc(100vh-32px)] md:m-4 bg-[rgba(10,10,12,0.95)] border border-white/[0.08] overflow-hidden flex flex-col md:flex-row"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-50 font-mono text-xs text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="w-full md:w-[60%] h-auto aspect-video md:h-full bg-black relative shrink-0">
                <div className="absolute inset-0">
                  {selectedProject.videoUrl ? (
                    <FramesPlayer
                      url={selectedProject.videoUrl}
                      thumbnail={selectedProject.thumbnailUrl}
                      controls={true}
                      autoplay={true}
                      muted={false}
                      aspectRatio="16:9"
                      className="h-full w-full"
                    />
                  ) : (
                    <img 
                      src={selectedProject.imageUrl || selectedProject.thumbnailUrl} 
                      alt={selectedProject.title} 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col relative overflow-y-auto p-8 custom-scrollbar scrollbar-width-thin" style={{ scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {selectedProject.contentType && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] border border-white/10 px-2 py-1 text-white/40 inline-block mb-3 w-fit">
                    {selectedProject.contentType}
                  </span>
                )}
                
                <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-white leading-tight mb-4">
                  {selectedProject.title}
                </h2>
                
                {selectedProject.description && (
                  <p className="text-sm text-white/55 font-light leading-relaxed mb-6">
                    {selectedProject.description}
                  </p>
                )}
                
                <div className="border-t border-white/[0.06] mb-5" />
                
                {selectedProject.subjectMatter && (
                  <div className="mb-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25 block mb-0.5">Client</span>
                    <span className="font-mono text-xs text-white/70">{selectedProject.subjectMatter}</span>
                  </div>
                )}
                
                {selectedProject.softwareUsed && selectedProject.softwareUsed.length > 0 && (
                  <div className="mt-1 mb-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25 block mb-1">Tools</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedProject.softwareUsed.map(tool => (
                        <span key={tool} className="font-mono text-[9px] px-2 py-0.5 border border-white/[0.08] text-white/40 rounded-sm">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-8 flex justify-between items-center w-full">
                  {(() => {
                    const currentIndex = projects.findIndex(p => (p._id || p.id) === (selectedProject._id || selectedProject.id));
                    return (
                      <>
                        {currentIndex > 0 ? (
                          <button
                            onClick={() => setSelectedProject(projects[currentIndex - 1])}
                            className="font-mono text-xs text-white/40 hover:text-white/80 transition-colors"
                          >
                            ← {truncate(projects[currentIndex - 1].title, 20)}
                          </button>
                        ) : <div />}
                        
                        {currentIndex >= 0 && currentIndex < projects.length - 1 ? (
                          <button
                            onClick={() => setSelectedProject(projects[currentIndex + 1])}
                            className="font-mono text-xs text-white/40 hover:text-white/80 transition-colors text-right"
                          >
                            {truncate(projects[currentIndex + 1].title, 20)} →
                          </button>
                        ) : <div />}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
