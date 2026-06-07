import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { portfolioApi } from '@/lib/api';
import { PortfolioData, Project } from '@/types';
import { IntroOverlay } from './components/IntroOverlay';
import { ProjectModal } from './components/ProjectModal';
import { FramesPlayer } from '@/components/shared/FramesPlayer';
import { Instagram, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
import { ToolIcon } from '@/components/shared/ToolIcon';

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
  const [scrolled, setScrolled] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading || !data) return null;

  const projects = data.projects || [];
  const bgVideoUrl = data.showreelUrl || projects[0]?.videoUrl;
  const bgImageUrl = data.showreelThumbnailUrl || projects[0]?.imageUrl || projects[0]?.thumbnailUrl;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black">
      
      {!introComplete && !isPreviewMode && (
        <IntroOverlay 
          name={data.name || 'Creative'} 
          role={data.role || 'Portfolio'} 
          profileImageUrl={data.profileImageUrl}
          onComplete={() => setIntroComplete(true)} 
        />
      )}

      {/* Global Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#050505]">
        {bgVideoUrl ? (
          <FramesPlayer 
            url={bgVideoUrl} 
            thumbnail={bgImageUrl}
            controls={false} 
            autoplay={true} 
            muted={true} 
            loop={true} 
            className="opacity-30 mix-blend-screen"
          />
        ) : bgImageUrl ? (
          <img src={bgImageUrl} alt="Background" className="w-full h-full object-cover opacity-30" />
        ) : null}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[100px]" />
      </div>

      <div className="relative z-10 w-full h-screen overflow-y-auto overflow-x-hidden">
        
        {/* Nav Bar */}
        <nav className={`fixed top-0 inset-x-0 h-[52px] z-50 transition-all duration-300 flex items-center justify-between px-4 md:px-8 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/[0.06]' : 'bg-transparent'}`}>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
              <path d="M4 8V4h4" />
              <path d="M20 8V4h-4" />
              <path d="M4 16v4h4" />
              <path d="M20 16v4h-4" />
            </svg>
            <span className="font-mono text-xs tracking-[0.2em] text-white/40">FRAMES</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <span className="font-mono text-xs text-white/60 hidden md:inline-block">{data.name}</span>
            <div className="flex items-center gap-3">
              {data.socials?.instagram && (
                <a href={data.socials.instagram} target="_blank" rel="noreferrer" className="hidden md:block text-white/40 hover:text-white/90 transition-colors duration-200">
                  <Instagram size={18} />
                </a>
              )}
              {data.socials?.linkedin && (
                <a href={data.socials.linkedin} target="_blank" rel="noreferrer" className="hidden md:block text-white/40 hover:text-white/90 transition-colors duration-200">
                  <Linkedin size={18} />
                </a>
              )}
              {data.socials?.discord && (
                <a href={data.socials.discord} target="_blank" rel="noreferrer" className="hidden md:block text-white/40 hover:text-white/90 transition-colors duration-200">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </a>
              )}
              {(data.socials?.email || data.contactEmail) && (
                <a href={`mailto:${data.contactEmail || data.socials?.email}`} className="block text-white/40 hover:text-white/90 transition-colors duration-200">
                  <Mail size={18} />
                </a>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative w-full min-h-[85dvh] flex flex-col justify-end pb-16 px-6 md:px-14">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display font-black uppercase tracking-tighter text-white leading-[0.88] break-words"
            style={{ fontSize: 'clamp(52px, 9vw, 130px)' }}
          >
            {data.name}
          </motion.h1>
          
          <div className="w-full border-b border-white/10 my-6" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
            <p className="font-light text-lg text-white/45 max-w-[440px] leading-[1.65]">
              {data.bio}
            </p>
            <div className="md:text-right">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#C0A36E]">
                {data.role}
              </div>
              {data.location && (
                <div className="font-mono text-xs text-white/30 mt-1 uppercase tracking-widest">
                  {data.location}
                </div>
              )}
              {data.availability?.status && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 border border-white/10 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em]">Available</span>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* About Section */}
        <section className="px-6 md:px-14 py-20 border-t border-white/[0.06]">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/25 mb-10">ABOUT</p>
          <div className="flex items-start gap-8 md:gap-16">
            {data.profileImageUrl && (
              <img
                src={data.profileImageUrl}
                alt={data.name}
                className="w-24 h-24 md:w-32 md:h-32 object-cover flex-shrink-0"
                style={{ borderRadius: 0 }}
              />
            )}
            <div>
              <p className="text-white/60 text-base md:text-lg font-light leading-relaxed max-w-xl">
                {data.bio}
              </p>
            </div>
          </div>
        </section>
        {/* Showreel Section */}
        {data.showreelUrl && (
          <section className="w-full mt-16 mb-24">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30 mb-3 ml-4 md:ml-14">
              SHOWREEL
            </div>
            <div className="w-full aspect-video md:aspect-[16/9]">
              <FramesPlayer
                url={data.showreelUrl}
                thumbnail={data.showreelThumbnailUrl}
                autoplay={true}
                muted={true}
                controls={true}
                loop={false}
              />
            </div>
            <div className="w-full border-b border-white/[0.08]" />
          </section>
        )}

        {/* Projects Grid */}
        {projects.length > 0 && (
          <section className="w-full mt-16 pb-24">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30 px-6 md:px-14 mb-6">
              WORK
            </div>
            <div className="grid grid-cols-12 gap-1 md:gap-4 px-1 md:px-4 auto-rows-auto">
              {projects.map((project, idx) => {
                const ratio = project.aspectRatio || '16:9';
                let colSpan = 'col-span-12 md:col-span-8'; // default landscape
                
                const isSparseGrid = projects.length <= 2;

                if (isSparseGrid) {
                  colSpan = 'col-span-12';
                } else if (idx === 0 && (ratio === '16:9' || ratio === '2.35:1')) {
                   colSpan = 'col-span-12';
                } else {
                   // mobile is col-span-6 for everything else
                   if (ratio === '16:9' || ratio === '2.35:1') colSpan = 'col-span-6 md:col-span-8';
                   if (ratio === '4:3') colSpan = 'col-span-6 md:col-span-6';
                   if (ratio === '1:1') colSpan = 'col-span-6 md:col-span-4';
                   if (ratio === '9:16') colSpan = 'col-span-6 md:col-span-3';
                }

                return (
                  <ProjectCard 
                    key={project._id || project.id} 
                    project={project} 
                    className={colSpan}
                    onClick={() => setSelectedProjectId(project._id || project.id as string)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Skills Section */}
        {data.tools && data.tools.length > 0 && (
          <section className="w-full px-6 md:px-14 pb-24">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30 mb-6">
              TOOLS & SOFTWARE
            </div>
            <div className="flex flex-wrap gap-3">
              {data.tools.map((tool, i) => {
                const isPrimary = i < 3; // First 3 or data.primaryTools (just using first 3)
                if (isPrimary) {
                  return (
                    <div key={tool} className="flex items-center gap-2 px-4 py-2 border border-white/15 rounded-full hover:border-white/30 hover:text-white/90 transition-colors bg-white/5 font-mono text-xs text-white/70">
                      <ToolIcon name={tool} />
                      {tool}
                    </div>
                  );
                }
                return (
                  <div key={tool} className="px-3 py-1.5 border border-white/[0.08] rounded-full hover:border-white/20 transition-colors font-mono text-[10px] text-white/40 hover:text-white/70">
                    {tool}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section className="relative w-full border-t border-white/[0.06] mt-16 py-32 px-6 md:px-14 overflow-hidden">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/25 mb-8">
            LET'S TALK
          </div>
          <h2 
            onClick={() => setIsContactOpen(true)}
            className="font-display font-black uppercase tracking-tighter text-white cursor-pointer hover:text-[#C0A36E] transition-colors duration-300"
            style={{ fontSize: 'clamp(52px, 10vw, 140px)', lineHeight: 0.85 }}
          >
            LET'S TALK
          </h2>
        </section>

        {/* Footer Attribution */}
        <div className="w-full text-center pb-12">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/15">
            BUILT WITH FRAMES
          </span>
        </div>

      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProjectId && (
          <ProjectModal
            project={projects.find(p => (p._id || p.id) === selectedProjectId)!}
            allProjects={projects}
            onClose={() => setSelectedProjectId(null)}
            onSelectProject={(id: string) => setSelectedProjectId(id)}
          />
        )}
      </AnimatePresence>

      {/* Contact Drawer */}
      <AnimatePresence>
        {isContactOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsContactOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[rgba(10,10,12,0.97)] backdrop-blur-xl border-t border-white/[0.08] p-6 md:p-12 pb-12 max-h-[50vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsContactOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                ✕
              </button>
              
              <h3 className="font-display text-2xl font-bold text-white mb-1">REACH OUT</h3>
              <p className="font-mono text-xs text-[#C0A36E] uppercase tracking-widest mb-8">
                Available for {data.role}
              </p>

              <div className="flex flex-wrap gap-3">
                {data.socials?.instagram && (
                  <a href={data.socials.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 border border-white/10 hover:border-white/30 transition-colors min-w-[160px]">
                    <Instagram size={18} />
                    <span className="font-mono text-xs">Instagram</span>
                  </a>
                )}
                {data.socials?.linkedin && (
                  <a href={data.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 border border-white/10 hover:border-white/30 transition-colors min-w-[160px]">
                    <Linkedin size={18} />
                    <span className="font-mono text-xs">LinkedIn</span>
                  </a>
                )}
                {data.socials?.discord && (
                  <a href={data.socials.discord} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 border border-white/10 hover:border-white/30 transition-colors min-w-[160px]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    <span className="font-mono text-xs">Discord</span>
                  </a>
                )}
                {(data.socials?.email || data.contactEmail) && (
                  <a href={`mailto:${data.contactEmail || data.socials?.email}`} className="flex items-center gap-3 px-4 py-3 border border-white/10 hover:border-white/30 transition-colors min-w-[160px]">
                    <Mail size={18} />
                    <span className="font-mono text-xs">{data.socials?.email || data.contactEmail}</span>
                  </a>
                )}
                
                {!data.socials?.instagram && !data.socials?.linkedin && !data.socials?.discord && !data.socials?.email && !data.contactEmail && (
                  <span className="text-white/40 text-sm font-light">Add your social links in the editor</span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// ----------------------------------------------------
// ProjectCard component
// ----------------------------------------------------
const ProjectCard = ({ project, className, onClick }: { project: Project; className: string; onClick: () => void; }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Aspect ratio conversion to CSS style
  const ratioParts = (project.aspectRatio || '16:9').split(':');
  const cssRatio = `${ratioParts[0]} / ${ratioParts[1]}`;

  return (
    <motion.div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsReady(false); }}
      className={`relative overflow-hidden bg-zinc-900 cursor-pointer ${className}`}
      style={{ aspectRatio: cssRatio, borderRadius: '0px' }}
    >
      <div className="w-full h-full relative overflow-hidden">
        {/* Background Image / Thumbnail */}
        <motion.img 
          src={project.imageUrl || project.thumbnailUrl} 
          alt={project.title}
          animate={{ scale: isHovered ? 1.04 : 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Video Player on Hover */}
        {isHovered && project.videoUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: isReady ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 scale-105" // slightly scaled to avoid edge bleeding
          >
            <FramesPlayer
              url={project.videoUrl}
              autoplay={true}
              muted={true}
              controls={false}
              loop={true}
              aspectRatio={project.aspectRatio as any || "16:9"}
              onReady={() => setIsReady(true)}
            />
          </motion.div>
        )}

        {/* Gradient Overlay */}
        <div 
          className="absolute inset-x-0 bottom-0 h-2/3 z-20 pointer-events-none transition-colors duration-300"
          style={{
            background: isHovered 
              ? 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)'
          }}
        />

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-3 md:p-4 z-30 pointer-events-none w-full flex items-end justify-between">
          <div>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/50 mb-1.5 border border-white/10 px-1.5 py-0.5 inline-block">
              {project.contentType || 'Project'}
            </span>
            <h3 
              className="font-display font-bold text-white tracking-tight leading-tight max-w-[80%]"
              style={{
                fontSize: project.title.length <= 15 ? 'clamp(18px, 2vw, 24px)' 
                        : project.title.length <= 25 ? 'clamp(16px, 1.8vw, 20px)'
                        : 'clamp(14px, 1.5vw, 18px)'
              }}
            >
              {project.title}
            </h3>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            className="text-white"
          >
            <ArrowUpRight size={20} strokeWidth={1.5} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
