import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Globe, Maximize2, Star, Sparkles, MonitorPlay, MapPin } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '../utils';

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

const ToolIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-6 h-6" }) => {
    const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
    const [imgSrc, setImgSrc] = useState(tool ? `https://cdn.simpleicons.org/${tool.slug}/white` : '');
    const [hasError, setHasError] = useState(false);
    const [useClearbit, setUseClearbit] = useState(false);

    useEffect(() => {
        if (tool) {
            setImgSrc(`https://cdn.simpleicons.org/${tool.slug}/white`);
            setHasError(false);
            setUseClearbit(false);
        }
    }, [name, tool]);

    const handleError = () => {
        if (!tool) { setHasError(true); return; }
        if (!useClearbit && tool.domain) {
            setUseClearbit(true);
            setImgSrc(`https://logo.clearbit.com/${tool.domain}`);
        } else {
            setHasError(true);
        }
    };

    if (!tool || hasError) {
        return <span className={`flex items-center justify-center font-bold text-zinc-500 text-[10px] uppercase border border-zinc-700 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    }

    return (
        <img src={imgSrc} alt={name} loading="lazy" className={`${className} object-contain ${useClearbit ? 'rounded-sm' : 'opacity-80'}`} onError={handleError} />
    );
};

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
};

const titleReveal = {
    initial: { y: 100, opacity: 0 },
    whileInView: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "circOut" } }
};

const IntroOverlay: React.FC<{ name: string; onComplete: () => void }> = ({ name, onComplete }) => {
    return (
        <motion.div 
            className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 2.8, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
        >
            <div className="relative flex flex-col items-center">
                <motion.div 
                    className="overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: "auto" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.h1 
                        className="text-5xl md:text-8xl lg:text-9xl font-display font-black text-white tracking-tighter uppercase whitespace-nowrap px-8"
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {name || "PORTFOLIO"}
                    </motion.h1>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="mt-4 flex items-center gap-4"
                >
                    <div className="h-px w-12 bg-zinc-800" />
                    <span className="text-zinc-500 font-display font-bold text-xs md:text-sm tracking-[0.4em] uppercase">Visual Storyteller</span>
                    <div className="h-px w-12 bg-zinc-800" />
                </motion.div>
            </div>

            {/* Sliding Doors Background */}
            <motion.div 
                className="absolute top-0 left-0 w-1/2 h-full bg-zinc-950 z-[-1]"
                initial={{ x: 0 }}
                animate={{ x: "-100%" }}
                transition={{ duration: 1.2, delay: 2.4, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div 
                className="absolute top-0 right-0 w-1/2 h-full bg-zinc-950 z-[-1]"
                initial={{ x: 0 }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, delay: 2.4, ease: [0.76, 0, 0.24, 1] }}
            />
        </motion.div>
    )
}

const HeroContent: React.FC<{ data: PortfolioData; isMobile?: boolean }> = ({ data, isMobile = false }) => {
    return (
        <motion.div 
            variants={staggerContainer} 
            initial="initial" 
            animate="animate" 
            className={`flex flex-col ${isMobile ? 'items-center text-center px-4' : 'items-start text-left'}`}
        >
            <motion.div 
                variants={fadeInUp} 
                className="relative mb-8 group"
            >
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden border-[6px] border-zinc-900 shadow-2xl relative z-10 transition-transform duration-500 hover:scale-[1.02]">
                    <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} loading="lazy" />
                    <div className={`absolute bottom-6 right-6 w-6 h-6 rounded-full border-4 border-zinc-900 z-20 ${data.availability.status ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-500'}`}></div>
                </div>
            </motion.div>

            <div className="space-y-6 max-w-xl">
                <motion.div variants={fadeInUp} className="space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md ${data.availability.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {data.availability.status ? 'Available for Work' : 'Unavailable'}
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white tracking-tighter leading-[0.85] uppercase">
                        {data.name || "YOUR NAME"}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-4 pt-2 justify-center lg:justify-start">
                        <p className="text-xl md:text-2xl lg:text-3xl text-zinc-400 font-medium tracking-tight">
                            {data.role || "Creative Director"}
                        </p>
                        {data.location && (
                            <div className="flex items-center gap-1.5 text-zinc-600 font-medium text-sm">
                                <MapPin size={14} />
                                <span>{data.location}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.p variants={fadeInUp} className="text-zinc-500 text-base md:text-lg leading-relaxed font-light">
                    {data.bio}
                </motion.p>
            </div>

            <motion.div variants={fadeInUp} className="pt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href={`mailto:${data.contactEmail}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-xs tracking-widest uppercase hover:bg-zinc-200 transition-all hover:translate-y-[-2px] shadow-2xl">
                    <Mail size={16} /> Get In Touch
                </a>
                
                <div className="flex items-center gap-2">
                    {Object.entries(data.socials).map(([key, val]) => {
                        if (!val) return null;
                        const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                        return (
                            <a 
                                key={key} 
                                href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all hover:scale-110"
                            >
                                <Icon size={18} />
                            </a>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

const PrimaryToolCard: React.FC<{ toolName: string }> = ({ toolName }) => {
    if (!toolName) return null;
    const color = getBrandColor(toolName);
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative group col-span-2 md:col-span-1 overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/30 to-transparent opacity-50"></div>
            <div className="relative p-8 flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="absolute top-6 right-6 text-[9px] font-bold uppercase tracking-[0.2em] text-yellow-400 flex items-center gap-1.5 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                    <Star size={10} fill="currentColor" /> Primary
                </div>
                <div className="w-20 h-20 rounded-2xl bg-black border border-zinc-700 flex items-center justify-center shadow-2xl mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl" style={{ backgroundColor: color }}></div>
                    <ToolIcon name={toolName} className="w-10 h-10 relative z-10" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-xl leading-tight">{toolName}</h4>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Main Workflow</p>
                </div>
            </div>
        </motion.div>
    );
};

const ShowreelPlayer: React.FC<{ src: string; thumbnail: string }> = ({ src, thumbnail }) => {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.3 });
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            if (isInView) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isInView]);

    return (
        <motion.div ref={containerRef} className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 group" initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}>
            <div className="relative h-full w-full bg-black z-10">
                 {!hasError ? (
                     <video 
                        ref={videoRef} 
                        src={src} 
                        poster={thumbnail} 
                        className="w-full h-full object-cover" 
                        loop 
                        muted={isMuted} 
                        playsInline 
                        autoPlay 
                        preload="metadata"
                        onError={() => setHasError(true)} 
                     />
                 ) : (
                     <div className="w-full h-full relative">
                        <img src={thumbnail} className="w-full h-full object-cover opacity-60" alt="Showreel" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <a href={src} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-black text-sm font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-transform">
                                <Play size={16} fill="black" /> Watch Showreel
                            </a>
                        </div>
                     </div>
                 )}
                 {!hasError && (
                     <div className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button onClick={() => setIsMuted(!isMuted)} className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all hover:scale-110">
                            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                         </button>
                     </div>
                 )}
                 <div className="absolute top-6 left-6 z-20 flex items-center">
                    <motion.div 
                        className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_12px_#dc2626]" 
                        animate={{ opacity: [1, 0.3, 1] }} 
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                 </div>
            </div>
        </motion.div>
    );
};

const AmbientProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    const isVideo = project.type === 'video';
    const isPortrait = project.aspectRatio === '9:16';
    return (
        <motion.div 
            className={`relative group cursor-pointer w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-500 hover:scale-[1.02] shadow-2xl ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`} 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            onClick={onClick}
        >
            <div className="absolute inset-0">
                <img src={project.thumbnail} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out" alt={project.title} loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full">
                 <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-2 block">{project.category}</span>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight mb-2 tracking-tighter">{project.title}</h3>
                    <p className="text-zinc-400 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 font-light">
                        {project.description}
                    </p>
                 </div>
            </div>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 delay-100">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-2xl">
                    {isVideo ? <Play size={20} fill="currentColor" /> : <Maximize2 size={20} />}
                </div>
            </div>
        </motion.div>
    )
}

const Lightbox: React.FC<{ src: string; type: 'video' | 'image'; title: string; aspectRatio?: '16:9' | '9:16'; onClose: () => void }> = ({ src, type, title, aspectRatio, onClose }) => {
    const driveEmbed = getDriveEmbedUrl(src);
    const isPortrait = aspectRatio === '9:16';
    return (
        <motion.div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <button className="absolute top-8 right-8 p-4 bg-zinc-800/50 rounded-full hover:bg-white hover:text-black transition-all text-white z-[1100] group">
                <X size={24} className="group-hover:rotate-90 transition-transform"/>
            </button>
            <motion.div className={`w-full ${isPortrait ? 'max-w-md h-[85vh]' : 'max-w-7xl'} flex flex-col items-center relative`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className={`w-full ${isPortrait ? 'h-full' : 'aspect-video'} rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] bg-black relative border border-zinc-800`}>
                    {type === 'video' ? (
                        driveEmbed ? (
                            <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : src.includes('youtube') || src.includes('vimeo') ? (
                            <iframe src={src} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : (
                            <video src={src} controls autoPlay preload="metadata" className="w-full h-full object-contain" playsInline />
                        )
                    ) : (
                        <img src={src} className="w-full h-full object-contain" alt={title} loading="lazy" />
                    )}
                </div>
                <h2 className="mt-8 text-3xl font-display font-bold text-white text-center tracking-tighter uppercase">{title}</h2>
            </motion.div>
        </motion.div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showIntro, setShowIntro] = useState(!isPreview); 
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [200, 350], [0, 1]);
  const headerY = useTransform(scrollY, [200, 350], [-80, 0]);
  
  useEffect(() => { 
      if (isPreview) setShowIntro(false); 
  }, [isPreview]);

  const allTools = [...data.tools];
  if (data.primaryTool && !allTools.includes(data.primaryTool)) { allTools.unshift(data.primaryTool); }
  const secondaryTools = allTools.filter(t => t !== data.primaryTool);

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-indigo-500/30 lg:overflow-hidden relative">
      <AnimatePresence>
        {showIntro && <IntroOverlay name={data.name} onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-indigo-900/10 rounded-full blur-[180px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-purple-900/10 rounded-full blur-[180px] animate-pulse delay-1000"></div>
      </div>

      <motion.div 
        className="fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-b border-white/5 z-[100] flex items-center px-8 justify-between pointer-events-none" 
        style={{ opacity: headerOpacity, y: headerY }}
      >
        <div className="flex items-center gap-4 pointer-events-auto">
            <img src={data.profileImage} className="w-10 h-10 rounded-full border border-zinc-800 object-cover" alt="Profile" />
            <span className="font-display font-black text-white text-lg tracking-tighter uppercase">{data.name}</span>
        </div>
        <a href={`mailto:${data.contactEmail}`} className="p-3 bg-white text-black rounded-full pointer-events-auto shadow-2xl hover:scale-110 transition-transform">
            <Mail size={18}/>
        </a>
      </motion.div>

      <div className="lg:flex h-full relative z-10">
          {/* Main Desktop Sidebar */}
          <aside className="hidden lg:flex lg:w-[45%] xl:w-[40%] lg:h-screen lg:border-r border-zinc-900/30 bg-black/40 backdrop-blur-3xl z-20 flex-col justify-center relative px-12 xl:px-20 overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.05)_0%,transparent_50%)]" />
             <HeroContent data={data} isMobile={false} />
          </aside>

          {/* Scrollable Content Area */}
          <main className="w-full lg:w-[55%] xl:w-[60%] lg:h-screen lg:overflow-y-auto custom-scrollbar relative" ref={containerRef}>
             <div className="p-6 md:p-12 lg:p-20 xl:p-24 space-y-24 pb-48 max-w-6xl mx-auto">
                 
                 <div className="lg:hidden py-12">
                    <HeroContent data={data} isMobile={true} />
                 </div>

                  {data.showreelLink && (
                      <section className="space-y-8">
                           <motion.div 
                            className="flex flex-col items-center lg:items-start"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                           >
                               <span className="text-zinc-600 font-display font-bold text-xs tracking-[0.4em] uppercase mb-4">Featured</span>
                               <h2 className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-white tracking-tighter uppercase leading-[0.8] mb-8">SHOWREEL</h2>
                           </motion.div>
                           <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                      </section>
                  )}

                  {data.projects.length > 0 && (
                      <section className="space-y-12">
                          <motion.div 
                            className="flex items-end justify-between border-b border-zinc-800/50 pb-8" 
                            variants={titleReveal} 
                            initial="initial" 
                            whileInView="whileInView" 
                            viewport={{ once: true, margin: "-10%" }}
                          >
                            <div className="space-y-2">
                                <span className="text-zinc-600 font-display font-bold text-xs tracking-[0.4em] uppercase">Portfolio</span>
                                <h2 className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-white tracking-tighter uppercase leading-[0.8]">MY<br/>WORKS</h2>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-5xl font-display font-bold text-indigo-500">{data.projects.length}</span>
                                <span className="text-zinc-500 font-display font-bold text-[10px] tracking-widest uppercase">Selects</span>
                            </div>
                          </motion.div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                            {data.projects.map(p => (
                                <AmbientProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                            ))}
                          </div>
                      </section>
                  )}

                  <section className="space-y-12">
                      <motion.div className="flex items-center gap-4 border-b border-zinc-900 pb-6" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                             <MonitorPlay size={24}/>
                          </div>
                          <h2 className="text-4xl font-display font-black text-white uppercase tracking-tight">EXPERTISE</h2>
                      </motion.div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {data.primaryTool && (<PrimaryToolCard toolName={data.primaryTool} />)}
                        {secondaryTools.map(tool => (
                            <motion.div 
                                key={tool} 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                whileInView={{ opacity: 1, scale: 1 }} 
                                viewport={{ once: true }} 
                                transition={{ duration: 0.4 }} 
                                className="flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900/20 border border-zinc-800 rounded-3xl hover:bg-zinc-900/40 hover:border-zinc-700 transition-all hover:translate-y-[-4px]"
                            >
                                <ToolIcon name={tool} className="w-10 h-10 opacity-60" />
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{tool}</span>
                            </motion.div>
                        ))}
                      </div>

                      {data.aiTools.length > 0 && (
                        <div className="pt-8 space-y-6">
                            <div className="flex items-center gap-3 text-zinc-600">
                                <Sparkles size={16}/>
                                <h3 className="text-[10px] font-display font-bold uppercase tracking-[0.4em]">Integrated Intelligence</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {data.aiTools.map(tool => (
                                    <motion.div key={tool} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl hover:bg-indigo-500/10 transition-all">
                                        <ToolIcon name={tool} className="w-6 h-6" />
                                        <span className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">{tool}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                      )}
                  </section>

                  <footer className="pt-32 pb-12 text-center">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-900 to-transparent mb-12" />
                    <p className="text-zinc-700 text-[10px] uppercase tracking-[0.5em] font-medium">{data.name} &copy; {new Date().getFullYear()}</p>
                    <p className="mt-4 text-zinc-800 text-[9px] uppercase tracking-[0.3em] font-bold">Created with Frames by Varun</p>
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
                aspectRatio={selectedProject.aspectRatio} 
                onClose={() => setSelectedProject(null)}
            />
        )}
      </AnimatePresence>
    </div>
  );
};