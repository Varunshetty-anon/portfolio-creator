import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { portfolioApi } from '@/lib/api';
import { PortfolioData } from '@/types';
import { IntroOverlay } from './components/IntroOverlay';
import { ProjectModal } from './components/ProjectModal';
import { FramesPlayer } from '@/components/shared/FramesPlayer';
import { Instagram, Twitter, Linkedin, Mail } from 'lucide-react';

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

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#161616] via-[#0a0a0a] to-[#050505] text-white overflow-hidden selection:bg-white selection:text-black">
      {/* Intro Overlay */}
      {!introComplete && (
        <IntroOverlay 
          name={data.name || 'Creative'} 
          role={data.role || 'Portfolio'} 
          profileImageUrl={data.profileImageUrl}
          onComplete={() => setIntroComplete(true)} 
        />
      )}

      {/* Subtle Noise Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-screen overflow-y-auto overflow-x-hidden no-scrollbar">
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-16 sm:pt-24 pb-40">
          
          {/* Header Block */}
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-start gap-8 sm:gap-12 mb-20 sm:mb-28"
          >
             <div className="shrink-0">
                {data.profileImageUrl ? (
                   <img src={data.profileImageUrl} alt={data.name} className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border border-white/10 shadow-2xl" />
                ) : (
                   <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-white/5 border border-white/10 shadow-2xl" />
                )}
             </div>
             <div className="flex-1 pt-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                  {data.name}
                </h1>
                <div className="text-base sm:text-lg text-white/60 font-light max-w-2xl leading-relaxed mb-8">
                  {data.bio}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs sm:text-sm font-medium uppercase tracking-widest text-white/40">
                   {data.role && <span>{data.role}</span>}
                   {data.role && data.location && <span className="w-1 h-1 rounded-full bg-white/20" />}
                   {data.location && <span>{data.location}</span>}
                   {(data.role || data.location) && <span className="w-1 h-1 rounded-full bg-white/20" />}
                   <span className="flex items-center gap-2 text-white/80 border border-white/10 px-3 py-1.5 rounded-full bg-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Available for work
                   </span>
                </div>
             </div>
          </motion.header>

          {/* Bento Projects Grid */}
          <main>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               {projects.map((project, idx) => (
                 <motion.div
                    key={project._id || project.id}
                    className="group relative aspect-[4/5] sm:aspect-square overflow-hidden rounded-2xl bg-[#111111] border border-white/5 cursor-pointer"
                    onClick={() => setSelectedProjectId(project._id || project.id as string)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "50px" }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    onMouseEnter={() => setHoveredProjectId(project._id || project.id as string)}
                    onMouseLeave={() => setHoveredProjectId(null)}
                  >
                     {/* Media Layer */}
                     <div className="absolute inset-0 w-full h-full bg-black/20">
                       {project.imageUrl ? (
                         <img src={project.imageUrl} alt={project.title} className="absolute inset-0 w-full h-full object-cover scale-[1.02] group-hover:scale-105 transition-transform duration-700" />
                       ) : project.videoUrl && hoveredProjectId === (project._id || project.id) ? (
                         <div className="absolute inset-0 w-full h-full scale-[1.02] group-hover:scale-105 transition-transform duration-700">
                           <FramesPlayer 
                             url={project.videoUrl} 
                             thumbnail={project.thumbnailUrl}
                             controls={false} 
                             autoplay={true} 
                             muted={true} 
                             loop={true} 
                           />
                         </div>
                       ) : project.thumbnailUrl ? (
                         <img src={project.thumbnailUrl} alt={project.title} className="absolute inset-0 w-full h-full object-cover scale-[1.02] group-hover:scale-105 transition-transform duration-700" />
                       ) : project.videoUrl ? (
                         <div className="absolute inset-0 w-full h-full scale-[1.02] group-hover:scale-105 transition-transform duration-700">
                           <FramesPlayer 
                             url={project.videoUrl} 
                             controls={false} 
                             autoplay={false} 
                             muted={true} 
                           />
                         </div>
                       ) : null}
                     </div>

                     {/* Gradient overlay */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                     {/* Meta content */}
                     <div className="absolute inset-0 p-6 flex flex-col justify-end pointer-events-none">
                        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                           <span className="text-[10px] font-mono tracking-widest uppercase text-white/50 block mb-2">{project.contentType || 'Project'}</span>
                           <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{project.title}</h3>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
          </main>

        </div>

        {/* Floating Bottom Nav */}
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
