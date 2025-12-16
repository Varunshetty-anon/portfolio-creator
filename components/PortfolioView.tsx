import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Maximize2, ExternalLink, ArrowRight } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { getBrandColor } from '../utils';

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

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }
  };

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
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-200" onClick={onClose}>
            <button className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full z-50 transition-colors" onClick={onClose}>
                <X size={32}/>
            </button>
            <div className="relative w-full max-w-7xl max-h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-full relative rounded-xl overflow-hidden shadow-2xl bg-black border border-zinc-800">
                     {type === 'video' ? (
                        src.includes('youtube') || src.includes('vimeo') ? (
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
            className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-transform hover:scale-105 select-none ${isMain ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-zinc-800'}`}
        >
            <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }}></span>
            <span className="text-xs font-medium text-zinc-300 tracking-wide">{name}</span>
        </div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Split layout structure:
  // Desktop: Left Fixed Sidebar (Identity) | Right Scrollable (Content)
  // Mobile: Stacked (Identity -> Content)

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vh] bg-purple-900/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] bg-blue-900/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1600px] mx-auto lg:grid lg:grid-cols-12 lg:gap-16 px-6 md:px-12 py-12 relative z-10">
          
          {/* === LEFT SIDEBAR (IDENTITY) === */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col lg:sticky lg:top-12 lg:h-[calc(100vh-6rem)] mb-16 lg:mb-0">
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                    {/* Avatar */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-32 h-32 md:w-40 md:h-40 mb-8 rounded-full p-1 border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm"
                    >
                        <img src={data.profileImage} className="w-full h-full object-cover rounded-full" alt={data.name} />
                        <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-black ${data.availability.status ? 'bg-green-500' : 'bg-red-500'}`} title={data.availability.status ? "Available for work" : "Currently busy"}></div>
                    </motion.div>

                    {/* Name & Role */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tighter leading-[0.9] text-white uppercase mb-4">
                            {data.name}
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 font-medium font-mono flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-zinc-700 inline-block"></span>
                            {data.role}
                        </p>
                    </motion.div>

                    {/* Bio */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <p className="text-zinc-400 leading-relaxed text-base max-w-md font-light">
                            {data.bio}
                        </p>
                    </motion.div>

                    {/* Meta */}
                    <div className="flex flex-col gap-3 text-sm text-zinc-500 font-mono uppercase tracking-widest mb-8">
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-zinc-600"/> {data.location}</div>
                        <div className="flex items-center gap-2"><Globe size={14} className="text-zinc-600"/> {data.languages}</div>
                    </div>

                    {/* Socials */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {Object.entries(data.socials).map(([key, val]) => {
                           if (!val) return null;
                           const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                           return (
                               <a key={key} href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} target="_blank" rel="noopener noreferrer" 
                                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:scale-110 transition-all duration-300">
                                   <Icon size={18} />
                               </a>
                           )
                        })}
                    </div>
                </div>

                {/* Footer / CTA (Desktop only mostly) */}
                <div className="hidden lg:block pt-8 border-t border-zinc-900">
                    <a href={`mailto:${data.contactEmail}`} className="group flex items-center gap-2 text-white font-bold hover:text-indigo-400 transition-colors">
                        <Mail size={18} />
                        <span>Get in Touch</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                    </a>
                </div>
              </div>
          </div>

          {/* === RIGHT CONTENT (SCROLLABLE) === */}
          <div className="lg:col-span-8 flex flex-col gap-24 pb-24">
              
              {/* SHOWREEL SECTION */}
              {data.showreelLink && (
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative w-full group cursor-pointer"
                    onClick={() => setSelectedProject({ id: 'reel', title: 'Showreel', link: data.showreelLink, type: 'video' } as any)}
                  >
                      {/* Glow Effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-2xl transition-opacity duration-700"></div>
                      
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                          <AutoPlayVideo src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                          
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors duration-300">
                                <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    <Maximize2 size={14} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Fullscreen</span>
                                </div>
                          </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Latest Showreel</h2>
                          <div className="h-[1px] flex-1 bg-zinc-900 mx-4"></div>
                          <span className="text-xs text-zinc-600 font-mono">2024</span>
                      </div>
                  </motion.div>
              )}

              {/* TOOLS */}
              {data.tools.length > 0 && (
                 <div>
                    <div className="flex flex-wrap gap-2">
                        {data.primaryTool && <ToolBadge name={data.primaryTool} isMain />}
                        {data.tools.map(t => <ToolBadge key={t} name={t} />)}
                    </div>
                 </div>
              )}

              {/* WORKS */}
              {data.projects.length > 0 && (
                  <div className="space-y-12">
                      <div className="flex items-end gap-4">
                          <h2 className="text-4xl font-display font-bold text-white">Selected Works</h2>
                          <span className="text-zinc-600 font-mono text-sm pb-1">({data.projects.length})</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-16">
                          {data.projects.map((p, index) => (
                              <motion.div 
                                key={p.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: index * 0.1 }}
                                className="group cursor-pointer"
                                onClick={() => setSelectedProject(p)}
                              >
                                 <div className={`relative w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 transition-all duration-500 group-hover:border-zinc-600 group-hover:shadow-2xl ${p.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm mx-auto md:mx-0' : 'aspect-video'}`}>
                                     <img src={p.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                                     
                                     {/* Hover Overlay */}
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                         <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                                             {p.type === 'image' ? <Maximize2 size={24}/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="mt-6 flex flex-col gap-2">
                                     <div className="flex justify-between items-start">
                                         <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                                         {p.link && !p.link.startsWith('blob:') && <ExternalLink size={18} className="text-zinc-600 group-hover:text-white transition-colors" />}
                                     </div>
                                     <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold px-2 py-1 bg-zinc-900 rounded text-zinc-400 uppercase tracking-wider">{p.category}</span>
                                        <div className="h-[1px] w-8 bg-zinc-800"></div>
                                        <p className="text-zinc-500 text-sm line-clamp-1">{p.description}</p>
                                     </div>
                                 </div>
                              </motion.div>
                          ))}
                      </div>
                  </div>
              )}

              {/* TESTIMONIALS */}
              {data.testimonials.length > 0 && (
                  <div className="space-y-8">
                       <h2 className="text-2xl font-display font-bold text-zinc-500 uppercase tracking-widest">Endorsements</h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {data.testimonials.map(t => (
                               <div key={t.id} className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:bg-zinc-900/50 transition-colors">
                                   <div className="mb-6 text-indigo-500/50"><span className="text-4xl font-serif">"</span></div>
                                   <p className="text-lg text-zinc-300 mb-6 font-light leading-relaxed">{t.quote}</p>
                                   <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                           {t.name.charAt(0)}
                                       </div>
                                       <div>
                                           <p className="font-bold text-white text-sm">{t.name}</p>
                                           <p className="text-xs text-zinc-500 uppercase tracking-wider">{t.role}</p>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                  </div>
              )}

              {/* MOBILE FOOTER */}
              <div className="lg:hidden pt-12 border-t border-zinc-900 text-center">
                  <a href={`mailto:${data.contactEmail}`} className="inline-block px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">
                     Get in Touch
                 </a>
                 <div className="mt-8 text-zinc-700 text-xs uppercase tracking-widest">
                     © {new Date().getFullYear()} {data.name}
                 </div>
              </div>

          </div>
      </div>

      {/* Lightbox Portal */}
      {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
              {selectedProject && (
                  <Lightbox 
                      src={selectedProject.link || selectedProject.thumbnail} 
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