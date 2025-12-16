import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, Play, Disc, Twitter, Linkedin, Youtube, X, Pause, Volume2, VolumeX, CheckCircle2, Laptop, ExternalLink, Maximize2 } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { getIconSlug, getBrandColor } from '../utils';

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
    <div className="relative w-full h-full bg-black group rounded-xl overflow-hidden">
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
      <div className="absolute bottom-4 right-4 z-30">
          <button onClick={toggleMute} className="bg-black/40 backdrop-blur p-2 rounded-full text-white">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
      </div>
    </div>
  )
};

const Lightbox = ({ src, type, onClose }: { src: string, type: 'video' | 'image', onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
            <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full" onClick={onClose}>
                <X size={32}/>
            </button>
            <div className="relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {type === 'video' ? (
                    src.includes('youtube') || src.includes('vimeo') ? (
                        <iframe src={src} className="w-full aspect-video rounded-lg" allow="autoplay; fullscreen" />
                    ) : (
                        <video src={src} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                    )
                ) : (
                    <img src={src} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                )}
            </div>
        </div>
    )
}

const ToolBadge: React.FC<{ name: string, isMain?: boolean }> = ({ name, isMain }) => {
    const color = getBrandColor(name);
    return (
        <div 
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${isMain ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800'}`}
            style={{ borderColor: `${color}40` }}
        >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
            <span className="text-sm font-medium text-zinc-200">{name}</span>
        </div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const containerRef = useRef(null);
  const { scrollY } = useScroll({ target: containerRef });

  // Header Transforms
  const headerY = useTransform(scrollY, [0, 200], [0, 0]);
  const headerScale = useTransform(scrollY, [0, 200], [1, 0.7]);
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 1]);
  const contentOpacity = useTransform(scrollY, [0, 150], [0, 1]);
  
  // Custom transform to move header to top-left
  const headerX = useTransform(scrollY, [0, 300], ['0%', '-35%']);
  const headerTop = useTransform(scrollY, [0, 300], ['30vh', '2rem']);
  
  // Mobile check
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto bg-black text-white font-sans selection:bg-indigo-500/30 relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-purple-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto min-h-[200vh] relative">
          
          {/* === STICKY HEADER === */}
          <motion.div 
            className="fixed left-0 right-0 z-50 flex flex-col items-center text-center pointer-events-none md:pointer-events-auto"
            style={{ 
                top: isMobile ? '2rem' : headerTop,
                x: isMobile ? 0 : headerX,
                scale: isMobile ? 1 : headerScale,
            }}
          >
             <div className="relative group">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl relative z-10">
                    <img src={data.profileImage} className="w-full h-full object-cover" />
                </div>
                {/* Glow behind avatar */}
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full -z-10 group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
             </div>

             <div className="mt-6 md:mt-8 bg-black/50 backdrop-blur-sm p-4 rounded-3xl">
                 <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase leading-none mb-2">{data.name}</h1>
                 <p className="text-lg md:text-xl text-indigo-400 font-medium">{data.role}</p>
                 
                 {/* Availability */}
                 <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${data.availability.status ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
                    <span className={`w-2 h-2 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {data.availability.status ? 'Available' : 'Busy'}
                 </div>
             </div>
          </motion.div>

          {/* === SCROLLABLE CONTENT === */}
          {/* Push content down to allow header to be centered initially */}
          <div className="pt-[110vh] md:pt-[100vh] pb-32 px-6 md:pl-[35%] relative z-10">
             
             {/* Bio & Socials - Visible immediately on scroll */}
             <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-24 max-w-2xl"
             >
                <p className="text-xl md:text-2xl leading-relaxed text-zinc-300 mb-8 font-light">{data.bio}</p>
                
                <div className="flex gap-4 mb-8">
                   {Object.entries(data.socials).map(([key, val]) => {
                       if (!val) return null;
                       const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                       return (
                           <a key={key} href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} target="_blank" className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:bg-white hover:text-black transition-colors">
                               <Icon size={20} />
                           </a>
                       )
                   })}
                </div>
                
                <div className="flex gap-6 text-sm text-zinc-500 font-mono uppercase tracking-widest">
                    <div className="flex items-center gap-2"><MapPin size={14}/> {data.location}</div>
                    <div className="flex items-center gap-2"><Globe size={14}/> {data.languages}</div>
                </div>
             </motion.div>

             {/* Showreel */}
             {data.showreelLink && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mb-32 group cursor-pointer"
                    onClick={() => setSelectedProject({ id: 'reel', title: 'Showreel', link: data.showreelLink, type: 'video' } as any)}
                 >
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Latest Reel</h2>
                    <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                        <AutoPlayVideo src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                                <Maximize2 className="text-white" />
                            </div>
                        </div>
                    </div>
                 </motion.div>
             )}

             {/* Works */}
             {data.projects.length > 0 && (
                 <div className="mb-32">
                     <h2 className="text-3xl font-display font-bold mb-12">Selected Works</h2>
                     <div className="grid grid-cols-1 gap-12">
                         {data.projects.map((p) => (
                             <motion.div 
                                key={p.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="group cursor-pointer"
                                onClick={() => setSelectedProject(p)}
                             >
                                <div className={`w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative shadow-lg transition-transform duration-500 hover:scale-[1.02] ${p.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm' : 'aspect-video'}`}>
                                    <img src={p.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    
                                    {/* Overlay for Video Types Only */}
                                    {p.type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-14 h-14 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                                                <Play fill="white" size={20} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                                    <p className="text-zinc-500 text-sm">{p.category}</p>
                                </div>
                             </motion.div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Tools - Conditional */}
             {data.tools.length > 0 && (
                 <div className="mb-32">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Arsenal</h2>
                    <div className="flex flex-wrap gap-3">
                        {data.primaryTool && <ToolBadge name={data.primaryTool} isMain />}
                        {data.tools.map(t => <ToolBadge key={t} name={t} />)}
                        {data.aiTools.map(t => <ToolBadge key={t} name={t} />)}
                    </div>
                 </div>
             )}
             
             {/* Testimonials - Conditional */}
             {data.testimonials.length > 0 && (
                 <div className="mb-32">
                     <h2 className="text-3xl font-display font-bold mb-12">Endorsements</h2>
                     <div className="grid grid-cols-1 gap-6">
                         {data.testimonials.map(t => (
                             <div key={t.id} className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                                 <p className="text-xl italic text-zinc-300 mb-6">"{t.quote}"</p>
                                 <div>
                                     <p className="font-bold text-white">{t.name}</p>
                                     <p className="text-xs text-zinc-500 uppercase tracking-wider">{t.role}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Footer */}
             <footer className="py-20 border-t border-zinc-900">
                 <h2 className="text-4xl font-display font-bold mb-6">Let's work together.</h2>
                 <a href={`mailto:${data.contactEmail}`} className="inline-block px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">
                     {data.contactEmail || 'Get in touch'}
                 </a>
                 <div className="mt-20 text-zinc-600 text-xs uppercase tracking-widest">
                     © {new Date().getFullYear()} {data.name} • Powered by Frames
                 </div>
             </footer>

          </div>
      </div>

      {/* Lightbox Portal */}
      {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
              {selectedProject && (
                  <Lightbox 
                      src={selectedProject.link || selectedProject.thumbnail} 
                      type={selectedProject.type} 
                      onClose={() => setSelectedProject(null)} 
                  />
              )}
          </AnimatePresence>,
          document.body
      )}

    </div>
  );
};