import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Maximize2, ExternalLink, ArrowRight } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { getBrandColor, getDriveEmbedUrl } from '../utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

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

const AutoPlayVideo = ({ src, thumbnail }: { src: string, thumbnail?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const driveEmbed = getDriveEmbedUrl(src);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }
  };

  if (driveEmbed) {
      return (
          <div className="relative w-full h-full bg-zinc-900 group rounded-xl overflow-hidden pointer-events-none">
              <iframe 
                src={driveEmbed} 
                className="w-full h-full object-cover border-0" 
                allow="autoplay"
              />
              {/* Overlay to catch clicks for parent lightbox trigger */}
              <div className="absolute inset-0 z-10"></div>
          </div>
      )
  }

  return (
    <div className="relative w-full h-full bg-zinc-900 group rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop
        autoPlay
        playsInline
        preload="metadata"
      />
      <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={toggleMute} className="bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-black transition-colors border border-white/10">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
      </div>
    </div>
  )
};

const Lightbox = ({ src, type, title, onClose }: { src: string, type: 'video' | 'image', title: string, onClose: () => void }) => {
    const driveEmbed = getDriveEmbedUrl(src);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-200" onClick={onClose}>
            <button className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full z-50 transition-colors" onClick={onClose}>
                <X size={32}/>
            </button>
            <div className="relative w-full max-w-7xl max-h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-full relative rounded-xl overflow-hidden shadow-2xl bg-black border border-zinc-800">
                     {type === 'video' ? (
                        driveEmbed ? (
                            <iframe src={driveEmbed} className="w-full aspect-video h-[80vh]" allow="autoplay; fullscreen" />
                        ) : src.includes('youtube') || src.includes('vimeo') ? (
                            <iframe src={src} className="w-full aspect-video" allow="autoplay; fullscreen" />
                        ) : (
                            <video src={src} controls autoPlay className="w-full max-h-[85vh] object-contain" />
                        )
                    ) : (
                        <img src={src} className="w-full max-h-[85vh] object-contain" />
                    )}
                </div>
                <h2 className="mt-4 text-xl font-display font-bold text-white tracking-tight">{title}</h2>
            </div>
        </div>
    )
}

const ToolBadge: React.FC<{ name: string, isMain?: boolean }> = ({ name, isMain }) => {
    const color = getBrandColor(name);
    return (
        <div 
            className={`px-4 py-2 rounded-lg border flex items-center gap-3 transition-transform hover:scale-105 select-none ${isMain ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-zinc-800'}`}
        >
            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }}></div>
            <span className="text-sm font-medium text-zinc-300 tracking-wide">{name}</span>
            {isMain && <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider ml-auto">Primary</span>}
        </div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-indigo-900/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vh] bg-blue-900/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-[1600px] mx-auto lg:grid lg:grid-cols-12 lg:gap-20 px-6 md:px-12 py-16 relative z-10">
          
          {/* === LEFT SIDEBAR (IDENTITY) === */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-8rem)] mb-20 lg:mb-0">
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                    {/* Avatar */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }} 
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative w-40 h-40 md:w-56 md:h-56 mb-12 rounded-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 ease-out"
                    >
                        <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                    </motion.div>

                    {/* Name & Role */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="mb-12"
                    >
                        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter leading-[0.85] text-white uppercase mb-6">
                            {data.name}
                        </h1>
                        <p className="text-xl md:text-2xl text-indigo-400 font-medium tracking-tight">
                            {data.role}
                        </p>
                    </motion.div>

                    {/* Bio */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-12"
                    >
                        <p className="text-zinc-400 leading-relaxed text-lg max-w-md font-light border-l-2 border-zinc-800 pl-6">
                            {data.bio}
                        </p>
                    </motion.div>

                    {/* Status & Location */}
                    <motion.div 
                         initial={{ opacity: 0 }} 
                         animate={{ opacity: 1 }}
                         transition={{ delay: 0.5 }}
                         className="flex gap-4 mb-12"
                    >
                         <div className={`px-4 py-2 rounded-full border ${data.availability.status ? 'bg-green-900/10 border-green-500/20 text-green-400' : 'bg-red-900/10 border-red-500/20 text-red-400'} flex items-center gap-2 text-xs font-bold uppercase tracking-widest`}>
                             <span className={`w-2 h-2 rounded-full ${data.availability.status ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                             {data.availability.status ? 'Available for Work' : 'Busy'}
                         </div>
                    </motion.div>

                    {/* Socials */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                        className="flex flex-wrap gap-4"
                    >
                        {Object.entries(data.socials).map(([key, val]) => {
                           if (!val) return null;
                           const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                           return (
                               <a key={key} href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} target="_blank" rel="noopener noreferrer" 
                                  className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:scale-110 transition-all duration-300">
                                   <Icon size={20} />
                               </a>
                           )
                        })}
                    </motion.div>
                </div>
              </div>
          </div>

          {/* === RIGHT CONTENT (SCROLLABLE) === */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-32 pb-32">
              
              {/* SKILLS */}
              {data.tools.length > 0 && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.3 }}
                 >
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8">Skills & Stack</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.primaryTool && (
                            <div className="col-span-1 md:col-span-2">
                                <ToolBadge name={data.primaryTool} isMain />
                            </div>
                        )}
                        {data.tools.map(t => <ToolBadge key={t} name={t} />)}
                    </div>
                 </motion.div>
              )}

              {/* SHOWREEL SECTION */}
              {data.showreelLink && (
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative w-full group cursor-pointer"
                    onClick={() => setSelectedProject({ id: 'reel', title: 'Showreel', link: data.showreelLink, type: 'video' } as any)}
                  >
                      <h2 className="text-4xl font-display font-bold text-white mb-8">Showreel</h2>
                      
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                          <AutoPlayVideo src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                          
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors duration-300">
                                <div className="flex items-center gap-2 px-6 py-3 bg-black/80 backdrop-blur rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    <Maximize2 size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Fullscreen</span>
                                </div>
                          </div>
                      </div>
                  </motion.div>
              )}

              {/* WORKS */}
              {data.projects.length > 0 && (
                  <div className="space-y-16">
                      <div className="flex items-end gap-4 border-b border-zinc-900 pb-8">
                          <h2 className="text-4xl font-display font-bold text-white">Selected Works</h2>
                          <span className="text-zinc-600 font-mono text-sm pb-2">({data.projects.length})</span>
                      </div>
                      
                      <div className="flex flex-col gap-24">
                          {data.projects.map((p, index) => (
                              <motion.div 
                                key={p.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: index * 0.1 }}
                                className="group cursor-pointer grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                                onClick={() => setSelectedProject(p)}
                              >
                                 <div className={`relative w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 transition-all duration-500 group-hover:border-zinc-600 group-hover:shadow-2xl ${p.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[300px]' : 'aspect-video'}`}>
                                     <img src={p.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                                     
                                     {/* Hover Overlay */}
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                         <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                                             {p.type === 'image' ? <Maximize2 size={24}/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="flex flex-col gap-4">
                                     <h3 className="text-3xl font-bold font-display text-white group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                                     <span className="text-xs font-bold px-2 py-1 bg-zinc-900 w-fit rounded text-zinc-400 uppercase tracking-wider">{p.category}</span>
                                     <p className="text-zinc-400 text-base leading-relaxed border-l border-zinc-800 pl-4">{p.description}</p>
                                     <div className="pt-4 flex items-center gap-2 text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                                         View Project <ArrowRight size={16} />
                                     </div>
                                 </div>
                              </motion.div>
                          ))}
                      </div>
                  </div>
              )}

              {/* TESTIMONIALS */}
              {data.testimonials.length > 0 && (
                  <div className="space-y-12">
                       <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Endorsements</h2>
                       <div className="grid grid-cols-1 gap-8">
                           {data.testimonials.map(t => (
                               <div key={t.id} className="p-10 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:bg-zinc-900/50 transition-colors">
                                   <div className="mb-6 text-indigo-500"><span className="text-6xl font-serif opacity-30">"</span></div>
                                   <p className="text-xl text-zinc-200 mb-8 font-light leading-relaxed -mt-8">{t.quote}</p>
                                   <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                                           {t.name.charAt(0)}
                                       </div>
                                       <div>
                                           <p className="font-bold text-white text-base">{t.name}</p>
                                           <p className="text-xs text-zinc-500 uppercase tracking-wider">{t.role}</p>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                  </div>
              )}
              
              {/* CTA */}
              <div className="p-12 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-center space-y-8">
                   <h2 className="text-4xl font-display font-bold text-white">Ready to collaborate?</h2>
                   <p className="text-zinc-400 max-w-lg mx-auto">I'm currently available for freelance projects and long-term partnerships. Let's make something loud.</p>
                   <div className="flex flex-col md:flex-row gap-4 justify-center">
                       <a href={`mailto:${data.contactEmail}`} className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                           Start a Project
                       </a>
                   </div>
              </div>

              {/* FOOTER */}
              <div className="pt-12 border-t border-zinc-900 flex justify-between items-center text-xs uppercase tracking-widest text-zinc-600">
                  <div>{data.name} © {new Date().getFullYear()}</div>
                  <div>Powered by Frames</div>
              </div>

          </div>
      </div>

      {/* Lightbox Portal */}
      {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
              {selectedProject && (
                  <Lightbox 
                      src={selectedProject.driveLink || selectedProject.link || selectedProject.thumbnail} 
                      type={selectedProject.type}
                      title={selectedProject.title} 
                      onClose={() => setSelectedProject(null)} 
                  />
              )}
          </AnimatePresence>,
          document.body
      )}

    </div>
  );
};