import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, ArrowUpRight, Globe, Maximize2, Zap } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST } from '../utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Utils ---
const getSocialUrl = (platform: string, handle: string) => {
    if (!handle) return '#';
    if (handle.startsWith('http')) return handle;
    const cleanHandle = handle.replace(/^@/, '');
    switch(platform) {
        case 'instagram': return `https://instagram.com/${cleanHandle}`;
        case 'twitter': return `https://twitter.com/${cleanHandle}`;
        case 'youtube': return `https://youtube.com/${cleanHandle}`;
        case 'linkedin': return `https://linkedin.com/in/${cleanHandle}`;
        default: return handle;
    }
};

const getToolIcon = (name: string) => {
    const tool = EDITING_TOOLS_LIST.find(t => t.name === name);
    if (!tool) return null;
    return `https://cdn.simpleicons.org/${tool.slug}/white`;
};

// --- Components ---

const IntroOverlay = ({ name, onComplete }: { name: string, onComplete: () => void }) => {
    return (
        <motion.div 
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 2, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
        >
            <div className="overflow-hidden">
                <motion.h1 
                    className="text-6xl md:text-9xl font-display font-black text-white tracking-tighter uppercase"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                >
                    {name.split(' ')[0] || "PORTFOLIO"}
                </motion.h1>
            </div>
            <motion.div 
                className="absolute bottom-0 left-0 w-full h-1 bg-white"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, ease: "anticipate" }}
            />
        </motion.div>
    )
}

const MainWorkflowCard = ({ toolName }: { toolName: string }) => {
    if (!toolName) return null;
    const icon = getToolIcon(toolName);
    const color = getBrandColor(toolName);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 relative group w-full max-w-[300px]"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-500" style={{ '--tw-gradient-from': color } as any}></div>
            <div className="relative bg-zinc-950/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-4 overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                     <img src={icon || ''} className="w-24 h-24 object-contain transform rotate-12 translate-x-4 -translate-y-4" alt="" />
                </div>
                
                <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center shadow-lg relative z-10 shrink-0">
                    <img src={icon || ''} className="w-7 h-7 object-contain" alt={toolName} />
                </div>
                <div className="relative z-10">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Primary Workflow</div>
                    <div className="text-lg font-bold text-white leading-tight">{toolName}</div>
                </div>
                <div className="ml-auto relative z-10">
                   <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                </div>
            </div>
        </motion.div>
    );
};

const AmbientProjectCard = ({ project, onClick }: { project: Project, onClick: () => void }) => {
    const isVideo = project.type === 'video';
    
    return (
        <motion.div 
            className={`relative group cursor-pointer mb-16 ${project.aspectRatio === '9:16' ? 'max-w-[350px] mx-auto' : 'w-full'}`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
            onClick={onClick}
        >
            {/* Ambient Glow */}
            <div 
                className="absolute -inset-4 rounded-[2rem] opacity-0 group-hover:opacity-60 blur-2xl transition-opacity duration-700 pointer-events-none z-0"
                style={{ 
                    backgroundImage: `url(${project.thumbnail})`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            
            <div className="relative z-10 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                 <div className={`relative w-full ${project.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                     <img src={project.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={project.title}/>
                     
                     {/* Overlay */}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                         {isVideo ? (
                             <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                 <Play fill="white" className="ml-1 text-white"/>
                             </div>
                         ) : (
                             <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                 <Maximize2 className="text-white"/>
                             </div>
                         )}
                     </div>

                     <div className="absolute top-4 left-4">
                         <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                             {project.category}
                         </span>
                     </div>
                 </div>

                 <div className="p-6 bg-zinc-950 border-t border-zinc-900 relative">
                     <div className="flex justify-between items-center">
                         <div>
                             <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
                             <p className="text-sm text-zinc-500 line-clamp-1">{project.description}</p>
                         </div>
                         <ArrowUpRight className="text-zinc-600 group-hover:text-white transition-colors" />
                     </div>
                 </div>
            </div>
        </motion.div>
    )
}

const Lightbox = ({ src, type, title, onClose }: { src: string, type: 'video' | 'image', title: string, onClose: () => void }) => {
    const driveEmbed = getDriveEmbedUrl(src);

    return (
        <motion.div 
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <div className="absolute top-6 right-6 z-50">
                 <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"><X size={24}/></button>
            </div>

            <motion.div 
                className="w-full max-w-7xl max-h-screen p-4 flex flex-col items-center"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                {type === 'video' ? (
                     <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black relative border border-zinc-800">
                        {driveEmbed ? (
                             <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : src.includes('youtube') || src.includes('vimeo') ? (
                             <iframe src={src} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : (
                             <video src={src} controls autoPlay className="w-full h-full object-contain" />
                        )}
                     </div>
                ) : (
                    <img src={src} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" alt={title} />
                )}
                <h2 className="mt-6 text-2xl font-display font-bold text-white text-center">{title}</h2>
            </motion.div>
        </motion.div>
    )
}

// --- Main Layout ---

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showIntro, setShowIntro] = useState(!isPreview); // Only show intro on full view initially
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback for preview mode updates
  useEffect(() => {
      if (isPreview) setShowIntro(false);
  }, [isPreview]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-white/20 overflow-hidden" ref={containerRef}>
      {showIntro && <IntroOverlay name={data.name} onComplete={() => setShowIntro(false)} />}
      
      <div className="lg:flex h-screen overflow-hidden">
          
          {/* === LEFT COLUMN (Sticky Profile) === */}
          <aside className="lg:w-[45%] lg:h-full relative flex flex-col justify-center p-8 md:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-zinc-900 bg-zinc-950/50 backdrop-blur-sm z-20 overflow-y-auto lg:overflow-hidden">
              <div className="max-w-xl mx-auto w-full space-y-8 lg:space-y-10">
                  
                  {/* Avatar */}
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ duration: 0.8, delay: 0.2 }}
                     className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl relative"
                  >
                      <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                      {/* Availability Dot on Avatar */}
                      <div className={`absolute bottom-4 right-4 w-6 h-6 rounded-full border-4 border-zinc-950 ${data.availability.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </motion.div>

                  <div className="space-y-4">
                      <motion.div
                         initial={{ opacity: 0, x: -50 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.8, delay: 0.4 }}
                      >
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-4 ${data.availability.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                              {data.availability.status ? 'Available for Work' : 'Unavailable'}
                          </div>
                          
                          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white tracking-tighter leading-[0.9] mb-2">
                              {data.name || "YOUR NAME"}
                          </h1>
                          <p className="text-xl md:text-2xl text-zinc-400 font-medium">
                              {data.role || "Creative Director"}
                          </p>
                      </motion.div>

                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-md"
                      >
                          {data.bio}
                      </motion.p>
                  </div>

                  {/* Main Workflow Card */}
                  {data.primaryTool && (
                      <MainWorkflowCard toolName={data.primaryTool} />
                  )}

                  {/* Contact Button (Left Side) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="pt-4"
                  >
                      <a href={`mailto:${data.contactEmail}`} className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-zinc-200 transition-colors">
                          <Mail size={16} /> Get In Touch
                      </a>
                  </motion.div>
              </div>
          </aside>

          {/* === RIGHT COLUMN (Scrollable Content) === */}
          <main className="lg:w-[55%] h-full overflow-y-auto custom-scrollbar relative bg-black/50">
             <div className="min-h-screen p-6 md:p-12 lg:p-20 space-y-24">
                 
                 {/* Socials (Mobile: moved here for flow, Desktop: Top Right) */}
                 <div className="flex flex-wrap gap-3">
                      {Object.entries(data.socials).map(([key, val]) => {
                           if (!val) return null;
                           const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                           return (
                               <a key={key} href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} target="_blank" rel="noopener noreferrer" 
                                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-xs font-bold uppercase tracking-wider">
                                   <Icon size={14} /> {key}
                               </a>
                           )
                        })}
                  </div>

                  {/* Showreel */}
                  {data.showreelLink && (
                      <section className="space-y-6">
                           <div className="flex items-center gap-4 mb-8">
                                <Zap size={16} className="text-yellow-500 fill-current"/>
                                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Showreel</h2>
                           </div>
                           <div 
                                className="aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative group cursor-pointer"
                                onClick={() => setSelectedProject({ id: 'reel', title: 'Showreel', link: data.showreelLink, type: 'video' } as any)}
                           >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"/>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center z-20 transition-transform group-hover:scale-110 border border-white/20">
                                    <Play fill="white" className="text-white ml-1" size={32}/>
                                </div>
                                <img src={data.showreelThumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Showreel"/>
                           </div>
                      </section>
                  )}

                  {/* Projects */}
                  {data.projects.length > 0 && (
                      <section>
                          <div className="flex items-end justify-between mb-12 border-b border-zinc-900 pb-4">
                             <h2 className="text-3xl font-display font-bold text-white">Selected Works</h2>
                             <span className="text-zinc-500 font-mono text-xs">{data.projects.length} PROJECTS</span>
                          </div>
                          
                          <div className="space-y-8">
                              {data.projects.map(p => (
                                  <AmbientProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                              ))}
                          </div>
                      </section>
                  )}

                  {/* Skills Grid */}
                  <section className="space-y-6">
                      <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Software & Tools</h2>
                      <div className="flex flex-wrap gap-3">
                          {data.tools.map(tool => (
                              <div key={tool} className="flex items-center gap-2 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors cursor-default">
                                  <img src={getToolIcon(tool) || ''} className="w-4 h-4 object-contain opacity-70" alt=""/>
                                  <span className="text-sm font-medium text-zinc-300">{tool}</span>
                              </div>
                          ))}
                          {data.aiTools.map(tool => (
                              <div key={tool} className="flex items-center gap-2 px-4 py-3 bg-indigo-900/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-900/20 transition-colors cursor-default">
                                  <img src={getToolIcon(tool) || ''} className="w-4 h-4 object-contain opacity-70" alt=""/>
                                  <span className="text-sm font-medium text-indigo-300">{tool}</span>
                              </div>
                          ))}
                      </div>
                  </section>

                  {/* Footer */}
                  <footer className="pt-24 pb-12 border-t border-zinc-900 text-center text-zinc-600 text-xs uppercase tracking-widest">
                       <p>{data.name} © {new Date().getFullYear()}</p>
                  </footer>
             </div>
          </main>
      </div>

      <AnimatePresence>
        {selectedProject && (
            <Lightbox 
                src={selectedProject.driveLink || selectedProject.link || selectedProject.thumbnail}
                type={selectedProject.type}
                title={selectedProject.title}
                onClose={() => setSelectedProject(null)}
            />
        )}
      </AnimatePresence>
    </div>
  );
};