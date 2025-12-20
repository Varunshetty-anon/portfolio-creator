import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, Variants } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Globe, Maximize2, Star, Sparkles, MonitorPlay, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { PortfolioData, Project } from '../../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, trackPortfolioClick, getDriveId } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="relative w-12 h-12">
      <motion.div
        className="absolute inset-0 border-2 border-zinc-800 rounded-full"
      />
      <motion.div
        className="absolute inset-0 border-2 border-t-white rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  </div>
);

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

const ToolIcon = React.memo(({ name, className = "w-6 h-6" }: { name: string; className?: string }) => {
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
});

const ShimmerImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    return (
        <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
            <motion.img 
                src={src || "https://picsum.photos/800/450"} 
                alt={alt} 
                className={`w-full h-full object-cover`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
            )}
        </div>
    );
};

const fadeInUp: Variants = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
    animate: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

const IntroOverlay: React.FC<{ name: string; onComplete: () => void }> = ({ name, onComplete }) => {
    return (
        <motion.div 
            className="fixed inset-0 z-[500] bg-[#020202] flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: 0.8, delay: 2.2, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
        >
            <div className="relative overflow-hidden">
                <motion.h1 
                    className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter uppercase"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    {name || "PORTFOLIO"}
                </motion.h1>
            </div>
        </motion.div>
    )
}

const HeroContent: React.FC<{ data: PortfolioData; isMobile?: boolean }> = React.memo(({ data, isMobile = false }) => {
    return (
        <motion.div 
            variants={staggerContainer} 
            initial="initial" 
            animate="animate" 
            className={`flex flex-col relative ${isMobile ? 'items-center text-center px-4 py-16 overflow-hidden min-h-[60vh] justify-center' : 'items-start text-left'}`}
        >
            {isMobile && (
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 select-none pointer-events-none w-full text-center">
                    <h2 className="text-[20vw] font-display font-black text-white/5 tracking-tighter uppercase leading-none whitespace-nowrap">
                        FRAMES
                    </h2>
                </div>
            )}

            <motion.div variants={fadeInUp} className="relative mb-8 group z-10">
                <div className="absolute -inset-4 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className={`${isMobile ? 'w-48 h-48' : 'w-32 h-32 md:w-40 md:h-40'} rounded-full overflow-hidden border border-zinc-800 shadow-2xl relative z-10 bg-zinc-900`}>
                    <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} loading="lazy" />
                </div>
                {data.availability.status && (
                    <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-full flex items-center gap-1.5 z-20">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-green-200">Open</span>
                    </div>
                )}
            </motion.div>

            <div className="space-y-6 max-w-2xl z-10">
                <motion.div variants={fadeInUp}>
                    <h1 className={`${isMobile ? 'text-5xl' : 'text-6xl md:text-8xl'} font-display font-black text-white tracking-tighter leading-[0.9] uppercase`}>
                        {data.name || "YOUR NAME"}
                    </h1>
                    
                    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 ${isMobile ? 'justify-center' : ''}`}>
                        <p className="text-xl md:text-2xl text-zinc-400 font-medium tracking-tight">
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

                <motion.p variants={fadeInUp} className="text-zinc-500 text-base md:text-lg leading-relaxed font-light max-w-lg">
                    {data.bio}
                </motion.p>
            </div>

            <motion.div variants={fadeInUp} className={`pt-8 flex flex-wrap gap-4 z-10 ${isMobile ? 'justify-center' : ''}`}>
                <a 
                    href={`mailto:${data.contactEmail}`} 
                    className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-xs tracking-widest uppercase hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                    onClick={() => trackPortfolioClick(data.uid!, 'email')}
                >
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
                                onClick={() => trackPortfolioClick(data.uid!, key)}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all hover:scale-110 active:scale-95"
                            >
                                <Icon size={18} />
                            </a>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
});

const PrimaryToolCard: React.FC<{ toolName: string }> = React.memo(({ toolName }) => {
    if (!toolName) return null;
    const color = getBrandColor(toolName);
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true, margin: "-50px" }} 
            transition={{ duration: 0.6 }} 
            className="relative group col-span-2 md:col-span-1 aspect-square rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                 <div className="absolute top-4 right-4">
                     <Star className="text-white fill-white w-4 h-4 opacity-20" />
                 </div>
                 <div className="w-20 h-20 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shadow-2xl relative group-hover:scale-110 transition-transform duration-500 ease-out">
                     <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full" style={{ color }} />
                     <ToolIcon name={toolName} className="w-10 h-10 relative z-10" />
                 </div>
                 <div className="text-center">
                     <h4 className="text-white font-bold text-lg">{toolName}</h4>
                     <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Primary Weapon</p>
                 </div>
            </div>
        </motion.div>
    );
});

const ShowreelPlayer: React.FC<{ src: string; thumbnail: string }> = React.memo(({ src, thumbnail }) => {
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.4 });

    const type = React.useMemo(() => {
        if (!src) return 'none';
        if (src.includes('youtube.com') || src.includes('youtu.be')) return 'youtube';
        if (src.includes('vimeo.com')) return 'vimeo';
        if (src.includes('drive.google.com')) return 'drive';
        return 'direct';
    }, [src]);

    useEffect(() => {
        if (type === 'direct' && videoRef.current) {
            if (isInView) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) playPromise.catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isInView, type, src]);

    const getEmbedSrc = () => {
        if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&showinfo=0&modestbranding=1`;
        }
        if (type === 'vimeo') {
             const vId = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)?.[1];
             return `https://player.vimeo.com/video/${vId}?autoplay=1&muted=1&loop=1&background=1`;
        }
        if (type === 'drive') {
             const dId = getDriveId(src);
             return `https://drive.google.com/file/d/${dId}/preview`;
        }
        return src;
    };

    return (
        <motion.div 
            ref={containerRef}
            className="relative w-full aspect-video rounded-3xl overflow-visible group"
            initial={{ opacity: 0, scale: 0.98 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }}
        >
            {/* Ambience Glow */}
            <div className="absolute -inset-1 sm:-inset-4 bg-zinc-800/50 blur-2xl sm:blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0">
                <img src={thumbnail} className="w-full h-full object-cover opacity-50" aria-hidden="true" />
            </div>

            <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl z-10"
                onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                }}
            >
                <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 ease-in-out ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}>
                    <img src={thumbnail || "https://picsum.photos/800/450"} className="w-full h-full object-cover" alt="Loading" />
                </div>

                {type === 'direct' ? (
                    <video 
                        ref={videoRef}
                        key={src}
                        src={src}
                        className="w-full h-full object-cover"
                        loop
                        muted={isMuted}
                        playsInline
                        preload="auto"
                        crossOrigin={undefined}
                        onCanPlay={() => setIsVideoReady(true)}
                        onWaiting={() => setIsVideoReady(false)} 
                        onPlaying={() => setIsVideoReady(true)}
                        controls={false}
                    />
                ) : (
                    <iframe 
                        src={getEmbedSrc()}
                        className="w-full h-full" 
                        allow="autoplay; fullscreen; picture-in-picture"
                        title="Showreel"
                        onLoad={() => setTimeout(() => setIsVideoReady(true), 1000)}
                    />
                )}

                {type === 'direct' && isVideoReady && (
                    <div className="absolute bottom-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                            {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

const AmbientProjectCard: React.FC<{ project: Project; onClick: () => void }> = React.memo(({ project, onClick }) => {
    const isVideo = project.type === 'video';
    const isPortrait = project.aspectRatio === '9:16';
    
    // Grid spanning logic: Portrait takes 2 rows, landscape takes 1.
    // We use standard row height in CSS grid to make this work like a masonry layout.
    const spanClass = isPortrait ? 'row-span-2' : 'row-span-1';
    
    return (
        <motion.div 
            className={`relative group cursor-pointer w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors duration-300 ${spanClass}`}
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            onClick={onClick}
        >
            <div className="absolute inset-0 z-0">
                <ShimmerImage src={project.thumbnail} alt={project.title} className="w-full h-full" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500 z-10" />
            
            <div className="absolute bottom-0 left-0 w-full p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                 {(project.contentType || project.category) && (
                     <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-2 block opacity-80">
                         {project.contentType || project.category}
                     </span>
                 )}
                 <h3 className="text-xl font-display font-bold text-white leading-tight mb-2 tracking-tight">
                     {project.title}
                 </h3>
                 <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-500">
                     <p className="text-zinc-400 text-xs line-clamp-2 font-light pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {project.description}
                     </p>
                 </div>
            </div>

            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    {isVideo ? <Play size={16} fill="currentColor" /> : <Maximize2 size={16} />}
                </div>
            </div>
        </motion.div>
    )
});

const Lightbox: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    const driveEmbed = getDriveEmbedUrl(project.link);
    const isPortrait = project.aspectRatio === '9:16';
    
    return (
        <motion.div 
            className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-8" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
        >
            <button className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-zinc-800/50 rounded-full hover:bg-white hover:text-black transition-all text-white z-[2100] group">
                <X size={24} className="group-hover:rotate-90 transition-transform"/>
            </button>

            <motion.div 
                className="w-full h-full md:max-w-6xl md:h-[85vh] bg-[#050505] md:border border-zinc-800 rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative" 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
            >
                {/* Video/Image Section */}
                <div className={`flex-1 relative bg-black flex items-center justify-center overflow-hidden ${isPortrait ? 'md:border-r border-zinc-800' : 'md:border-r border-zinc-800'}`}>
                    <div className={`relative w-full h-full flex items-center justify-center ${isPortrait ? 'md:p-8' : ''}`}>
                         {project.type === 'video' ? (
                            <div className={`relative w-full ${isPortrait ? 'aspect-[9/16] h-full max-h-full' : 'aspect-video w-full'}`}>
                                {driveEmbed ? (
                                    <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                                ) : project.link.includes('youtube') || project.link.includes('vimeo') ? (
                                    <iframe src={project.link} className="w-full h-full" allow="autoplay; fullscreen" />
                                ) : (
                                    <video 
                                        src={project.link} 
                                        controls 
                                        autoPlay 
                                        className="w-full h-full object-contain" 
                                        playsInline 
                                        crossOrigin={undefined}
                                    />
                                )}
                            </div>
                        ) : (
                            <img src={project.link || project.thumbnail} className="w-full h-full object-contain" alt={project.title} loading="lazy" />
                        )}
                    </div>
                </div>

                {/* Metadata Sidebar */}
                <div className="w-full md:w-80 lg:w-96 shrink-0 bg-zinc-900/50 backdrop-blur-xl border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col h-auto md:h-full overflow-y-auto custom-scrollbar">
                     <div className="p-8 space-y-8">
                         <div>
                             <h2 className="text-2xl font-display font-bold text-white tracking-tight leading-tight mb-4">{project.title}</h2>
                             <p className="text-zinc-400 text-sm leading-relaxed font-light">{project.description || "No description provided."}</p>
                         </div>
                         
                         <div className="space-y-6">
                             {project.contentType && (
                                 <div>
                                     <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Content Type</h4>
                                     <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-medium text-white">
                                         {project.contentType}
                                     </span>
                                 </div>
                             )}

                             {project.subjectMatter && (
                                 <div>
                                     <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Subject Matter</h4>
                                     <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-medium text-white">
                                         {project.subjectMatter}
                                     </span>
                                 </div>
                             )}

                             {project.softwareUsed && project.softwareUsed.length > 0 && (
                                 <div>
                                     <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Tools Used</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {project.softwareUsed.map(tool => (
                                             <div key={tool} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs font-medium text-zinc-300">
                                                 <ToolIcon name={tool} className="w-3 h-3 opacity-70" />
                                                 {tool}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showIntro, setShowIntro] = useState(!isPreview); 
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [100, 200], [0, 1]);
  const headerY = useTransform(scrollY, [100, 200], [-20, 0]);
  
  useEffect(() => { 
      if (isPreview) setShowIntro(false); 
      if (!isPreview && data.uid) trackPortfolioView(data.uid);
  }, [isPreview, data.uid]);

  const allTools = [...(data.tools || [])];
  if (data.primaryTool && !allTools.includes(data.primaryTool)) allTools.unshift(data.primaryTool);
  const secondaryTools = allTools.filter(t => t !== data.primaryTool);
  const hasAnyTools = data.primaryTool || secondaryTools.length > 0 || (data.aiTools && data.aiTools.length > 0);

  return (
    <div className="h-screen w-full bg-[#020202] text-zinc-100 font-sans selection:bg-white/20 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
      <AnimatePresence>
        {showIntro && <IntroOverlay name={data.name} onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      <motion.div 
        className="fixed top-0 left-0 right-0 h-20 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 z-[100] flex items-center px-6 md:px-12 justify-between pointer-events-none" 
        style={{ opacity: headerOpacity, y: headerY }}
      >
        <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800">
                <img src={data.profileImage} className="w-full h-full object-cover" alt="Profile" />
            </div>
            <span className="font-display font-bold text-white text-sm tracking-wide uppercase">{data.name}</span>
        </div>
        <a 
            href={`mailto:${data.contactEmail}`} 
            className="hidden md:flex items-center gap-2 px-5 py-2 bg-white text-black hover:bg-zinc-200 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all pointer-events-auto"
        >
            <Mail size={12} /> Contact
        </a>
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 pb-32 max-w-7xl">
          <div className="min-h-[85vh] flex flex-col justify-center py-20">
              <HeroContent data={data} isMobile={false} />
          </div>

          {(data.showreelLink || data.showreelThumbnail) && (
             <div className="mb-40">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }}
                    className="mb-12 flex items-center gap-4 max-w-md"
                >
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <h2 className="text-sm font-display font-bold text-zinc-500 tracking-[0.2em] uppercase">Featured Showreel</h2>
                 </motion.div>
                 <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
             </div>
          )}
          
          {hasAnyTools && (
               <div className="mb-40">
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {data.primaryTool && <PrimaryToolCard toolName={data.primaryTool} />}
                        {secondaryTools.map(tool => (
                            <motion.div 
                                key={tool}
                                initial={{ opacity: 0, scale: 0.95 }} 
                                whileInView={{ opacity: 1, scale: 1 }} 
                                viewport={{ once: true }}
                                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 transition-colors group aspect-square"
                            >
                                <ToolIcon name={tool} className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" />
                                <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300">{tool}</span>
                            </motion.div>
                        ))}
                        {(data.aiTools || []).map(tool => (
                             <motion.div 
                                key={tool}
                                initial={{ opacity: 0, scale: 0.95 }} 
                                whileInView={{ opacity: 1, scale: 1 }} 
                                viewport={{ once: true }}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 transition-colors group aspect-square"
                            >
                                <div className="absolute top-3 right-3"><Sparkles size={10} className="text-indigo-500/50" /></div>
                                <ToolIcon name={tool} className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300">{tool}</span>
                            </motion.div>
                        ))}
                   </div>
               </div>
          )}

          {data.projects && data.projects.length > 0 && (
              <div className="space-y-16">
                   <motion.div 
                        initial={{ opacity: 0 }} 
                        whileInView={{ opacity: 1 }} 
                        viewport={{ once: true }}
                        className="flex justify-between items-end border-b border-zinc-800 pb-6"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tighter">Selected Works</h2>
                        <span className="text-zinc-500 font-display font-bold text-xs tracking-widest hidden md:block">
                            {String(data.projects.length).padStart(2, '0')} PROJECTS
                        </span>
                   </motion.div>

                   {/* Collage Grid Layout */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[320px] grid-flow-dense">
                       {data.projects.map(project => (
                           <AmbientProjectCard 
                                key={project.id} 
                                project={project} 
                                onClick={() => setSelectedProject(project)} 
                           />
                       ))}
                   </div>
              </div>
          )}
          
          <footer className="mt-40 pt-20 border-t border-zinc-900 text-center space-y-12">
               <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Thanks for watching</h2>
               <div className="flex justify-center gap-8">
                    {Object.entries(data.socials).map(([key, val]) => {
                        if (!val) return null;
                         const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                        return (
                            <a 
                                key={key} 
                                href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} 
                                className="text-zinc-500 hover:text-white transition-colors hover:scale-110 transform"
                            >
                                <Icon size={24} />
                            </a>
                        )
                    })}
               </div>
               <div className="pb-12 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                   © {new Date().getFullYear()} {data.name}. All rights reserved.
               </div>
          </footer>
      </div>

      <AnimatePresence>
          {selectedProject && <Lightbox project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </AnimatePresence>
    </div>
  );
};
