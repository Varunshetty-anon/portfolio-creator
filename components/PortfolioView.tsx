import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, ArrowUpRight, Globe, Maximize2, Zap, Check, Star, Cpu, Sparkles, MonitorPlay } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '../utils';

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

const ToolIcon = ({ name, className = "w-6 h-6" }: { name: string, className?: string }) => {
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
        <img 
            src={imgSrc} 
            alt={name}
            className={`${className} object-contain ${useClearbit ? 'rounded-sm' : 'opacity-80'}`}
            onError={handleError}
        />
    );
};

// --- Animations ---
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

// --- Components ---

const IntroOverlay = ({ name, onComplete }: { name: string, onComplete: () => void }) => {
    return (
        <motion.div 
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 2, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
        >
            <div className="overflow-hidden relative z-10">
                <motion.h1 
                    className="text-6xl md:text-9xl font-display font-black text-white tracking-tighter uppercase"
                    initial={{ y: 100, rotate: 5 }}
                    animate={{ y: 0, rotate: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {name.split(' ')[0] || "PORTFOLIO"}
                </motion.h1>
            </div>
            {/* Curtain reveal */}
            <motion.div 
                className="absolute top-0 left-0 w-full h-full bg-black z-20"
                initial={{ y: 0 }}
                animate={{ y: '-100%' }}
                transition={{ duration: 1, delay: 2.2, ease: [0.76, 0, 0.24, 1] }}
            />
        </motion.div>
    )
}

const HeroContent = ({ data, isMobile = false }: { data: PortfolioData, isMobile?: boolean }) => {
    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className={`space-y-12 origin-top ${isMobile ? 'py-12' : ''}`}>
             <motion.div 
                variants={fadeInUp}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl relative mb-8"
            >
                <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                <div className={`absolute bottom-4 right-4 w-5 h-5 rounded-full border-4 border-zinc-950 ${data.availability.status ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
            </motion.div>

            <div className="space-y-6">
                <motion.div variants={fadeInUp}>
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md ${data.availability.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {data.availability.status ? 'Available for Work' : 'Unavailable'}
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tighter leading-[0.9] mb-4">
                        {data.name || "YOUR NAME"}
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-400 font-medium tracking-tight">
                        {data.role || "Creative Director"}
                    </p>
                </motion.div>

                <motion.p variants={fadeInUp} className="text-zinc-500 text-sm md:text-base leading-relaxed max-w-md">
                    {data.bio}
                </motion.p>
            </div>

            <motion.div variants={fadeInUp} className="pt-4 flex flex-wrap gap-4">
                <a href={`mailto:${data.contactEmail}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-xs tracking-widest uppercase hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    <Mail size={16} /> Contact Me
                </a>
                
                <div className="flex items-center gap-2">
                    {Object.entries(data.socials).map(([key, val]) => {
                        if (!val) return null;
                        const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                        return (
                            <a key={key} href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} target="_blank" rel="noopener noreferrer" 
                                className="p-3.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all hover:border-zinc-600 hover:scale-110">
                                <Icon size={18} />
                            </a>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

const PrimaryToolCard = ({ toolName }: { toolName: string }) => {
    if (!toolName) return null;
    const color = getBrandColor(toolName);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group col-span-2 md:col-span-1 overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/30 to-transparent opacity-50"></div>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent"></div>
            
            <div className="relative p-8 flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                    <Star size={10} fill="currentColor" /> Primary
                </div>
                
                <div className="w-20 h-20 rounded-2xl bg-black border border-zinc-700 flex items-center justify-center shadow-2xl mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl" style={{ backgroundColor: color }}></div>
                    <ToolIcon name={toolName} className="w-10 h-10 relative z-10" />
                </div>
                
                <div>
                    <h4 className="text-white font-bold text-xl leading-tight">{toolName}</h4>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Main Workflow</p>
                </div>
            </div>
        </motion.div>
    );
};

const ShowreelPlayer = ({ src, thumbnail }: { src: string, thumbnail: string }) => {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if(videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    }, [src]);

    return (
        <motion.div 
            className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 group"
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
            {/* AMBIENCE GLOW */}
            <div className="absolute -inset-10 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 blur-[80px] opacity-60 animate-pulse pointer-events-none"></div>

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
                        preload="auto"
                        onError={() => setHasError(true)}
                     />
                 ) : (
                     <div className="w-full h-full relative">
                         <img src={thumbnail} className="w-full h-full object-cover opacity-60" alt="Showreel" />
                         <div className="absolute inset-0 flex items-center justify-center">
                             <a href={src} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-black font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-transform">
                                 <Play size={16} fill="black" /> Watch Showreel
                             </a>
                         </div>
                     </div>
                 )}

                 {!hasError && (
                     <div className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all hover:scale-110"
                         >
                             {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                         </button>
                     </div>
                 )}
                 
                 <div className="absolute top-6 left-6 z-20 px-3 py-1.5 bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-sm animate-pulse shadow-lg">
                     Live Preview
                 </div>
            </div>
        </motion.div>
    );
};

const AmbientProjectCard = ({ project, onClick }: { project: Project, onClick: () => void }) => {
    const isVideo = project.type === 'video';
    const isPortrait = project.aspectRatio === '9:16';
    
    return (
        <motion.div 
            className={`relative group cursor-pointer w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-500 hover:scale-[1.02] shadow-2xl hover:shadow-indigo-500/20 ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            onClick={onClick}
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                <img src={project.thumbnail} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt={project.title}/>
            </div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            
            {/* Content Content - Bottom Overlay Style */}
            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full">
                 <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2 block">{project.category}</span>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight mb-2 group-hover:text-white transition-colors">{project.title}</h3>
                    <p className="text-zinc-400 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{project.description}</p>
                 </div>
            </div>

            {/* Hover Play/Expand Icon */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0 delay-100">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                    {isVideo ? <Play size={20} fill="currentColor" /> : <Maximize2 size={20} />}
                </div>
            </div>
        </motion.div>
    )
}

const Lightbox = ({ src, type, title, aspectRatio, onClose }: { src: string, type: 'video' | 'image', title: string, aspectRatio?: '16:9' | '9:16', onClose: () => void }) => {
    const driveEmbed = getDriveEmbedUrl(src);
    const isPortrait = aspectRatio === '9:16';

    return (
        <motion.div 
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <button className="absolute top-6 right-6 p-4 bg-zinc-800/50 rounded-full hover:bg-zinc-700 transition-colors text-white z-50 group">
                <X size={24} className="group-hover:rotate-90 transition-transform"/>
            </button>

            <motion.div 
                className={`w-full ${isPortrait ? 'max-w-sm h-[85vh]' : 'max-w-7xl'} p-4 flex flex-col items-center relative`}
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
            >
                {/* AMBIENCE GLOW AROUND LIGHTBOX */}
                <div className="absolute -inset-10 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>

                {type === 'video' ? (
                     <div className={`w-full ${isPortrait ? 'h-full' : 'aspect-video'} rounded-3xl overflow-hidden shadow-2xl bg-black relative border border-zinc-800 ring-1 ring-white/10 z-10`}>
                        {driveEmbed ? (
                             <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : src.includes('youtube') || src.includes('vimeo') ? (
                             <iframe src={src} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : (
                             <video src={src} controls autoPlay preload="auto" className="w-full h-full object-contain" />
                        )}
                     </div>
                ) : (
                    <img src={src} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl relative z-10" alt={title} />
                )}
                <h2 className="mt-8 text-3xl font-display font-bold text-white text-center tracking-tight relative z-10">{title}</h2>
            </motion.div>
        </motion.div>
    )
}

// --- Main Layout ---

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showIntro, setShowIntro] = useState(!isPreview); 
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll(); // Native window scroll for mobile
  
  // Header animations
  const headerOpacity = useTransform(scrollY, [200, 300], [0, 1]);
  const headerY = useTransform(scrollY, [200, 300], [-100, 0]);

  useEffect(() => {
      if (isPreview) setShowIntro(false);
  }, [isPreview]);

  const allTools = [...data.tools];
  if (data.primaryTool && !allTools.includes(data.primaryTool)) {
      allTools.unshift(data.primaryTool);
  }
  const secondaryTools = allTools.filter(t => t !== data.primaryTool);

  return (
    <div className="min-h-screen lg:h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30 lg:overflow-hidden relative">
      {showIntro && <IntroOverlay name={data.name} onComplete={() => setShowIntro(false)} />}
      
      {/* --- Ambient Gradients (Apple-like) --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-blue-900/5 rounded-full blur-[120px] animate-pulse delay-500"></div>
      </div>

      {/* === MOBILE STICKY HEADER === */}
      {/* Hidden on desktop/tablet initially, only shows on scroll on mobile */}
      <motion.div 
        className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center px-6 justify-between pointer-events-none"
        style={{ opacity: headerOpacity, y: headerY }}
      >
          <div className="flex items-center gap-4 pointer-events-auto">
              <img src={data.profileImage} className="w-10 h-10 rounded-full border border-zinc-800 shadow-md" alt="Profile" />
              <span className="font-display font-bold text-white text-base tracking-wide">{data.name}</span>
          </div>
          <a href={`mailto:${data.contactEmail}`} className="p-3 bg-white text-black rounded-full pointer-events-auto shadow-lg hover:scale-105 transition-transform"><Mail size={16}/></a>
      </motion.div>

      {/* Main Layout Container */}
      <div className="lg:flex h-full relative z-10">
          
          {/* === LEFT COLUMN (Desktop Fixed Sidebar) === */}
          {/* Changed lg:flex to xl:flex to force single column on smaller tablets for better space usage */}
          <aside className="hidden xl:flex xl:w-[45%] xl:h-full xl:border-r border-zinc-900/50 bg-black/20 backdrop-blur-sm z-20 flex-col justify-center relative">
              <div className="p-16 xl:p-24 w-full h-full flex flex-col justify-center max-w-3xl mx-auto">
                  <HeroContent data={data} isMobile={false} />
              </div>
          </aside>

          {/* === RIGHT COLUMN (Scrollable Content) === */}
          <main className="w-full xl:w-[55%] h-auto xl:h-full xl:overflow-y-auto custom-scrollbar relative" ref={containerRef}>
             {/* Center constrained container */}
             <div className="min-h-screen p-6 md:p-12 lg:p-24 xl:p-32 space-y-20 pb-40 max-w-6xl mx-auto pt-6 xl:pt-32">
                 
                 {/* Mobile Hero (Shows on tablet too now due to xl breakpoint) */}
                 <div className="xl:hidden">
                     <HeroContent data={data} isMobile={true} />
                 </div>

                  {/* Showreel Section */}
                  {data.showreelLink && (
                      <section className="space-y-8 mt-0 xl:mt-0">
                           <motion.div 
                                className="mb-6"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                           >
                                <h2 className="text-7xl md:text-8xl font-display font-black text-white tracking-tighter uppercase leading-none">SHOWREEL</h2>
                           </motion.div>
                           
                           <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                      </section>
                  )}

                  {/* Projects Grid */}
                  {data.projects.length > 0 && (
                      <section>
                          <motion.div 
                             className="flex items-end justify-between mb-12 border-b border-zinc-800 pb-8"
                             variants={titleReveal}
                             initial="initial"
                             whileInView="whileInView"
                             viewport={{ once: true, margin: "-10%" }}
                          >
                             <h2 className="text-6xl lg:text-8xl font-display font-black text-white tracking-tighter uppercase leading-none">MY<br/>WORKS</h2>
                             <div className="flex flex-col items-end">
                                 <span className="text-5xl font-display font-bold text-zinc-700">{data.projects.length}</span>
                                 <span className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Projects</span>
                             </div>
                          </motion.div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {data.projects.map(p => (
                                  <AmbientProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                              ))}
                          </div>
                      </section>
                  )}

                  {/* Skills Grid */}
                  <section className="space-y-12 pt-10">
                      <motion.div 
                        className="flex items-center gap-3 mb-10 border-b border-zinc-900 pb-6"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                      >
                         <MonitorPlay size={24} className="text-indigo-400"/>
                         <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tight">SKILLS</h2>
                      </motion.div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          {/* Primary Tool Card */}
                          {data.primaryTool && (
                              <PrimaryToolCard toolName={data.primaryTool} />
                          )}

                          {/* Secondary Tools */}
                          {secondaryTools.map(tool => (
                              <motion.div 
                                key={tool} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:bg-zinc-900 hover:border-zinc-700 transition-all hover:scale-105"
                              >
                                  <ToolIcon name={tool} className="w-8 h-8 opacity-80" />
                                  <span className="text-xs font-medium text-zinc-400">{tool}</span>
                              </motion.div>
                          ))}
                      </div>

                      {/* AI Tools Separated */}
                      {data.aiTools.length > 0 && (
                          <div className="pt-8">
                             <div className="flex items-center gap-2 mb-6 text-zinc-500">
                                 <Sparkles size={16}/>
                                 <h3 className="text-xs font-bold uppercase tracking-widest">AI Tools Knowledge</h3>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {data.aiTools.map(tool => (
                                    <motion.div 
                                        key={tool} 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl hover:bg-indigo-500/10 transition-all hover:scale-105"
                                    >
                                        <ToolIcon name={tool} className="w-6 h-6" />
                                        <span className="text-xs font-medium text-indigo-300/80">{tool}</span>
                                    </motion.div>
                                ))}
                             </div>
                          </div>
                      )}
                  </section>

                  {/* Footer */}
                  <footer className="pt-32 border-t border-zinc-900 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
                       <p>{data.name} © {new Date().getFullYear()}</p>
                       <p className="mt-4 text-zinc-700">Created with Frames</p>
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