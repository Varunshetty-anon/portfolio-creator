import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Maximize2, ExternalLink, ArrowRight, Video, ArrowUpRight } from 'lucide-react';
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
      <div className="absolute bottom-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                <h2 className="mt-6 text-2xl font-display font-bold text-white tracking-tight">{title}</h2>
            </div>
        </div>
    )
}

const ToolBadge: React.FC<{ name: string, isMain?: boolean }> = ({ name, isMain }) => {
    const color = getBrandColor(name);
    return (
        <div 
            className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-transform hover:scale-105 select-none ${isMain ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-zinc-800'}`}
        >
            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }}></div>
            <span className="text-xs font-medium text-zinc-300 tracking-wide">{name}</span>
        </div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleCreateOwn = () => {
      window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-white/20 overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vh] bg-indigo-900/5 blur-[120px] rounded-full opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] bg-purple-900/5 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-24 relative z-10 space-y-24">
          
          {/* === HERO SECTION === */}
          <header className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end">
                  <div className="space-y-6 max-w-2xl">
                      {/* Avatar & Availability */}
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900">
                             <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                          </div>
                          <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${data.availability.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                              {data.availability.status ? 'Available for Work' : 'Currently Busy'}
                          </div>
                      </div>

                      <div className="space-y-2">
                        <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tighter text-white leading-[0.9]">
                            {data.name || "YOUR NAME"}
                        </h1>
                        <p className="text-xl md:text-3xl text-zinc-400 font-medium tracking-tight">
                            {data.role || "Creative Director"}
                        </p>
                      </div>
                      
                      <p className="text-lg text-zinc-500 leading-relaxed max-w-lg">
                          {data.bio}
                      </p>
                  </div>

                  {/* Socials */}
                  <div className="flex gap-2 flex-wrap justify-end">
                      {Object.entries(data.socials).map(([key, val]) => {
                           if (!val) return null;
                           const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                           return (
                               <a key={key} href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} target="_blank" rel="noopener noreferrer" 
                                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200">
                                   <Icon size={18} />
                               </a>
                           )
                        })}
                  </div>
              </div>

              {/* Skills Ticker */}
              {(data.primaryTool || data.tools.length > 0) && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-900/50">
                      {data.primaryTool && <ToolBadge name={data.primaryTool} isMain />}
                      {data.tools.map(t => <ToolBadge key={t} name={t} />)}
                  </div>
              )}
          </header>

          {/* === SHOWREEL SECTION === */}
          {data.showreelLink && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                  <div className="flex items-center gap-4">
                      <h2 className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Showreel</h2>
                      <div className="h-px bg-zinc-900 flex-1"></div>
                  </div>
                  
                  <div 
                    className="aspect-video w-full bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 relative group cursor-pointer"
                    onClick={() => setSelectedProject({ id: 'reel', title: 'Showreel', link: data.showreelLink, type: 'video' } as any)}
                  >
                      <AutoPlayVideo src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                      
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                           <div className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-full font-bold transform scale-90 group-hover:scale-100 transition-transform">
                               <Play size={18} fill="currentColor"/>
                               <span>Watch Full Reel</span>
                           </div>
                      </div>
                  </div>
              </section>
          )}

          {/* === PROJECTS SECTION === */}
          {data.projects.length > 0 && (
             <section className="space-y-12">
                 <div className="flex items-end justify-between border-b border-zinc-900 pb-6">
                     <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">Selected Works</h2>
                     <span className="text-zinc-600 font-mono text-sm pb-1">({data.projects.length})</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
                    {data.projects.map((p, index) => (
                        <motion.div 
                            key={p.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1 }}
                            className="group cursor-pointer space-y-4"
                            onClick={() => setSelectedProject(p)}
                        >
                            {/* Thumbnail */}
                            <div className={`relative w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 transition-all duration-500 group-hover:border-zinc-600 group-hover:shadow-2xl ${p.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[280px]' : 'aspect-video'}`}>
                                <img src={p.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                                    {p.category}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-2xl font-display font-bold text-white group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                                    <ArrowUpRight size={20} className="text-zinc-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"/>
                                </div>
                                <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{p.description}</p>
                            </div>
                        </motion.div>
                    ))}
                 </div>
             </section>
          )}

          {/* === TESTIMONIALS === */}
          {data.testimonials.length > 0 && (
              <section className="space-y-8">
                  <h2 className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Endorsements</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {data.testimonials.map(t => (
                           <div key={t.id} className="p-8 bg-zinc-900/20 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                               <p className="text-lg text-zinc-300 font-light italic mb-6">"{t.quote}"</p>
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                       {t.name.charAt(0)}
                                   </div>
                                   <div>
                                       <div className="text-sm font-bold text-white">{t.name}</div>
                                       <div className="text-xs text-zinc-600 uppercase tracking-wider">{t.role}</div>
                                   </div>
                               </div>
                           </div>
                       ))}
                  </div>
              </section>
          )}
          
          {/* === FOOTER CTA === */}
           <section className="py-24 border-t border-zinc-900 text-center space-y-8">
              <h2 className="text-4xl md:text-7xl font-display font-bold text-white tracking-tighter">Let's create together.</h2>
              <p className="text-zinc-500 max-w-lg mx-auto text-lg">
                  I'm currently accepting new projects. Reach out if you want to build something distinctive.
              </p>
              <div className="pt-4">
                  <a href={`mailto:${data.contactEmail}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition-colors group">
                      <Mail size={20} />
                      <span>Get in Touch</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                  </a>
              </div>
           </section>

           {/* Branding Footer */}
           <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-700 pb-8">
              <span>{data.name} © {new Date().getFullYear()}</span>
              {!isPreview && (
                  <button onClick={handleCreateOwn} className="hover:text-zinc-400 transition-colors">
                      Built with Frames
                  </button>
              )}
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