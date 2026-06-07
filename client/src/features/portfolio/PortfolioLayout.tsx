import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { portfolioApi } from '@/lib/api';
import { PortfolioData } from '@/types';
import { IntroOverlay } from './components/IntroOverlay';
import { ProjectModal } from './components/ProjectModal';
import { FramesPlayer } from '@/components/shared/FramesPlayer';
import { Instagram, Twitter, Linkedin, Mail, ArrowRight } from 'lucide-react';

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

  // Sync draft data updates in preview mode
  useEffect(() => {
    if (isPreviewMode && draftData) {
      setData(draftData);
    }
  }, [draftData, isPreviewMode]);

  if (loading || !data) return null;

  const projects = data.projects || [];

  // Determine global background based on hover
  const hoveredProject = hoveredProjectId ? projects.find(p => (p._id || p.id) === hoveredProjectId) : null;
  const bgVideoUrl = hoveredProject?.videoUrl || data.showreelUrl;
  const bgImageUrl = hoveredProject?.imageUrl || hoveredProject?.thumbnailUrl || data.showreelThumbnailUrl;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-white selection:text-black">
      {/* Intro Overlay */}
      {!introComplete && (
        <IntroOverlay 
          name={data.name || 'Creative'} 
          role={data.role || 'Portfolio'} 
          onComplete={() => setIntroComplete(true)} 
        />
      )}

      {/* Global Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#050505]">
        <AnimatePresence mode="wait">
          <motion.div
            key={hoveredProjectId || 'showreel'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
          >
            {bgVideoUrl ? (
               <FramesPlayer 
                 url={bgVideoUrl} 
                 thumbnail={bgImageUrl}
                 controls={false} 
                 autoplay={true} 
                 muted={true} 
                 loop={true} 
               />
            ) : bgImageUrl ? (
               <img src={bgImageUrl} alt="Background" className="w-full h-full object-cover" />
            ) : null}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#050505]/70" />
      </div>

      {/* Grain Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-screen overflow-y-auto overflow-x-hidden no-scrollbar">
        
        {/* ━━━ HERO SECTION ━━━ */}
        <section className="relative w-full min-h-[100dvh] flex flex-col justify-end pb-16 md:pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 30 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-start w-full"
          >
            <h1 className="text-[clamp(60px,10vw,140px)] font-black uppercase tracking-tighter text-white leading-[0.9] m-0 p-0">
              {data.name}
            </h1>
            
            <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#C0A36E] mt-6">
              {data.role}
            </div>
            
            <p className="font-light text-lg md:text-xl text-white/50 max-w-[480px] mt-3 leading-[1.6]">
              {data.bio}
            </p>

            <div className="hidden md:flex absolute bottom-0 right-0 items-center gap-2 text-white/80 font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              AVAILABLE FOR WORK
            </div>
          </motion.div>
        </section>

        {/* ━━━ PROJECTS SECTION ━━━ */}
        <section className="w-full px-4 sm:px-6 md:px-8 max-w-7xl mx-auto pb-32">
           <div className="w-full flex flex-col">
              {projects.map((project, idx) => (
                <motion.div
                  key={project._id || project.id}
                  className="group relative w-full border-b border-white/[0.08] cursor-pointer"
                  onClick={() => setSelectedProjectId(project._id || project.id as string)}
                  onMouseEnter={() => setHoveredProjectId(project._id || project.id as string)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "100px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                   {/* Mobile thumbnail */}
                   <div className="block md:hidden w-full aspect-video mb-4 mt-6 bg-[#111111] overflow-hidden">
                     {project.imageUrl || project.thumbnailUrl ? (
                       <img src={project.imageUrl || project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
                     ) : null}
                   </div>

                   <div className="w-full py-6 md:py-12 flex flex-row items-center relative">
                      <div className="font-mono text-xs text-white/25 group-hover:text-white/50 transition-colors duration-300 w-[48px] shrink-0">
                        {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      
                      <div className="flex-1 flex items-center justify-between overflow-hidden pr-4">
                         <h3 className="text-[clamp(32px,5.5vw,80px)] font-bold uppercase tracking-tighter text-white/35 group-hover:text-white group-hover:translate-x-2 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap truncate">
                           {project.title}
                         </h3>

                         <div className="hidden md:flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-4 shrink-0">
                           <span className="font-mono text-xs tracking-[0.2em] uppercase text-white/40">
                             {project.contentType || 'Project'}
                           </span>
                           <ArrowRight className="text-white/40 -rotate-45 group-hover:rotate-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" size={16} />
                         </div>
                      </div>

                      {/* Gold Accent Line */}
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#C0A36E] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                   </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* ━━━ ABOUT SECTION ━━━ */}
        <section className="w-full px-4 sm:px-6 md:px-8 max-w-7xl mx-auto pb-48">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8">
            <div className="flex flex-col items-start">
               {data.name && (
                 <div className="text-xs font-mono tracking-widest text-white/50 uppercase mb-2">
                   {data.name}
                 </div>
               )}
               {data.role && (
                 <div className="text-[10px] font-mono tracking-[0.2em] text-[#C0A36E] uppercase mb-8">
                   {data.role}
                 </div>
               )}
               
               {data.profileImageUrl && (
                 <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] mb-8 bg-[#111] overflow-hidden">
                   <img src={data.profileImageUrl} alt={data.name} className="w-full h-full object-cover grayscale opacity-80" />
                 </div>
               )}

               {data.bio && (
                 <p className="font-light text-base md:text-lg text-white/60 leading-relaxed max-w-[400px]">
                   {data.bio}
                 </p>
               )}
            </div>
            
            <div className="hidden md:block">
               {/* Subtle decoration space */}
            </div>
          </div>
        </section>

        {/* ━━━ FOOTER ━━━ */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: introComplete ? 0 : 100, opacity: introComplete ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full px-4 flex justify-center"
        >
          <div className="pointer-events-auto bg-[#111111]/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl flex items-center gap-2">
             <a 
               href={`mailto:${data.contactEmail || data.socials?.email || ''}`} 
               className="bg-white text-black hover:bg-white/90 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"
             >
               <Mail size={14} />
               Let's Talk
             </a>
             {data.socials?.twitter && (
               <a href={data.socials.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                  <Twitter size={16} />
               </a>
             )}
             {data.socials?.instagram && (
               <a href={data.socials.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                  <Instagram size={16} />
               </a>
             )}
             {data.socials?.linkedin && (
               <a href={data.socials.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                  <Linkedin size={16} />
               </a>
             )}
          </div>
        </motion.div>

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
    </div>
  );
}
