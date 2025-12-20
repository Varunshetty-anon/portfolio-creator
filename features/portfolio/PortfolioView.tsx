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
    <div className="relative w-16 h-16">
      <motion.div
        className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"
      />
      <motion.div
        className="absolute inset-0 border-4 border-t-indigo-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 blur-lg border-4 border-t-indigo-500 rounded-full opacity-50"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-indigo-500 font-display font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse"
    >
      Rendering Frames
    </motion.span>
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
            {!isLoaded && (
                <div className="absolute inset-0 z-10 bg-zinc-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            )}
            <img 
                src={src || "https://picsum.photos/800/450"} 
                alt={alt} 
                className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
        </div>
    );
};

const fadeInUp: Variants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer: Variants = {
    animate: { transition: { staggerChildren: 0.1 } }
};

const IntroOverlay: React.FC<{ name: string; onComplete: () => void }> = ({ name, onComplete }) => {
    return (
        <motion.div 
            className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 3.2, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
        >
            <div className="relative flex flex-col items-center gap-12">
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

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                >
                    <LoadingSpinner />
                </motion.div>
            </div>

            <motion.div 
                className="absolute top-0 left-0 w-1/2 h-full bg-zinc-950 z-[-1]"
                initial={{ x: 0 }}
                animate={{ x: "-100%" }}
                transition={{ duration: 1.2, delay: 2.8, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div 
                className="absolute top-0 right-0 w-1/2 h-full bg-zinc-950 z-[-1]"
                initial={{ x: 0 }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, delay: 2.8, ease: [0.76, 0, 0.24, 1] }}
            />
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
                    <h2 className="text-[30vw] font-display font-black text-white/40 tracking-tighter uppercase leading-none whitespace-nowrap">
                        PORTFOLIO
                    </h2>
                </div>
            )}

            <motion.div 
                variants={fadeInUp} 
                className="relative mb-10 group z-10"
            >
                <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-500" />
                <div className={`${isMobile ? 'w-64 h-64 sm:w-80 sm:h-80' : 'w-48 h-48 lg:w-56 lg:h-56'} rounded-full overflow-hidden border-[8px] border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.6)] relative z-10 transition-transform duration-500 hover:scale-[1.03]`}>
                    <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} loading="lazy" />
                    <div className={`absolute bottom-[8%] right-[8%] ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} rounded-full border-[3px] border-zinc-900 z-20 ${data.availability.status ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]'}`}></div>
                </div>
            </motion.div>

            <div className="space-y-6 max-w-xl z-10">
                <motion.div variants={fadeInUp} className="space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md ${data.availability.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {data.availability.status ? 'Available for Work' : 'Unavailable'}
                    </div>
                    
                    <h1 className={`${isMobile ? 'text-6xl sm:text-7xl' : 'text-5xl md:text-7xl lg:text-8xl'} font-display font-black text-white tracking-tighter leading-[0.85] uppercase`}>
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

            <motion.div variants={fadeInUp} className="pt-8 flex flex-wrap gap-4 justify-center lg:justify-start z-10">
                <a 
                    href={`mailto:${data.contactEmail}`} 
                    className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-xs tracking-widest uppercase hover:bg-zinc-200 transition-all hover:translate-y-[-2px] shadow-2xl"
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
});

const PrimaryToolCard: React.FC<{ toolName: string }> = React.memo(({ toolName }) => {
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
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
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
            className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-black group"
            initial={{ opacity: 0, scale: 0.98 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }}
            onClick={() => {
                setIsMuted(!isMuted);
                if (videoRef.current) videoRef.current.muted = !isMuted;
            }}
        >
            <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 ease-in-out ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}>
                <div className="relative w-full h-full">
                    <img src={thumbnail || "https://picsum.photos/800/450"} className="w-full h-full object-cover" alt="Loading" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            </div>

            {type === 'direct' ? (
                <video 
                    ref={videoRef}
                    key={src} // FORCE RE-RENDER IF SRC CHANGES
                    src={src}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                    preload="metadata"
                    crossOrigin={undefined} // EXPLICITLY UNDEFINED TO PREVENT CORS
                    onCanPlay={() => setIsVideoReady(true)}
                    onWaiting={() => setIsVideoReady(false)} 
                    onPlaying={() => setIsVideoReady(true)}
                    controls={false}
                    onError={(e) => {
                        console.error("Video Error:", e.currentTarget.error);
                        setIsVideoReady(false);
                    }}
                />
            ) : (
                <iframe 
                    src={getEmbedSrc()}
                    className="w-full h-full" 
                    allow="autoplay; fullscreen; picture-in-picture"
                    title="Showreel"
                    onLoad={() => {
                        setTimeout(() => setIsVideoReady(true), 1500);
                    }}
                />
            )}

            {type === 'direct' && isVideoReady && (
                <div className="absolute bottom-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                        {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                    </button>
                </div>
            )}
        </motion.div>
    );
});

const AmbientProjectCard: React.FC<{ project: Project; onClick: () => void }> = React.memo(({ project, onClick }) => {
    const isVideo = project.type === 'video';
    const isPortrait = project.aspectRatio === '9:16';
    const isSquare = project.aspectRatio === '1:1';
    
    // Determine grid span based on aspect ratio
    const spanClass = isPortrait ? 'row-span-2' : '';
    
    return (
        <motion.div 
            className={`relative group cursor-pointer w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-500 hover:scale-[1.02] shadow-2xl ${spanClass} ${isPortrait ? 'aspect-[9/16]' : isSquare ? 'aspect-square' : 'aspect-video'}`} 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }} 
            onClick={onClick}
        >
            <div className="absolute inset-0">
                <ShimmerImage src={project.thumbnail} alt={project.title} className="w-full h-full" />
                <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-110 pointer-events-none"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full">
                 <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    {(project.contentType || project.category) && <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-2 block">{project.contentType || project.category}</span>}
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
});

const Lightbox: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    const driveEmbed = getDriveEmbedUrl(project.link);
    const isPortrait = project.aspectRatio === '9:16';
    const isSquare = project.aspectRatio === '1:1';
    
    return (
        <motion.div 
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-0 md:p-8" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
        >
            <button className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-zinc-800/50 rounded-full hover:bg-white hover:text-black transition-all text-white z-[1100] group">
                <X size={24} className="group-hover:rotate-90 transition-transform"/>
            </button>

            <motion.div 
                className="w-full h-full md:max-w-6xl md:h-auto md:max-h-[90vh] bg-black md:bg-zinc-900/30 md:border border-zinc-800 rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative" 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Video/Image Section - Flexible */}
                <div className={`flex-1 relative bg-black flex items-center justify-center overflow-hidden ${isPortrait ? 'md:max-w-lg mx-auto md:border-r border-zinc-800' : 'md:border-r border-zinc-800'}`}>
                    <div className={`relative w-full ${isPortrait ? 'h-full md:aspect-[9/16]' : isSquare ? 'aspect-square max-h-full' : 'aspect-video w-full'}`}>
                         {project.type === 'video' ? (
                            driveEmbed ? (
                                <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                            ) : project.link.includes('youtube') || project.link.includes('vimeo') ? (
                                <iframe src={project.link} className="w-full h-full" allow="autoplay; fullscreen" />
                            ) : (
                                <video 
                                    src={project.link} 
                                    controls 
                                    autoPlay 
                                    preload="metadata" 
                                    className="w-full h-full object-contain" 
                                    playsInline 
                                    crossOrigin={undefined} 
                                    onError={(e) => console.error("Lightbox Video Error:", e.currentTarget.error)}
                                />
                            )
                        ) : (
                            <img src={project.link || project.thumbnail} className="w-full h-full object-contain" alt={project.title} loading="lazy" />
                        )}
                    </div>
                </div>

                {/* Metadata Sidebar - Fixed width on desktop, stacked on mobile */}
                <div className="w-full md:w-80 lg:w-96 shrink-0 bg-zinc-900/80 backdrop-blur-xl border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col h-[40vh] md:h-auto md:min-h-full overflow-y-auto custom-scrollbar">
                     <div className="p-6 md:p-8 space-y-8">
                         <div>
                             <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tighter leading-tight mb-4">{project.title}</h2>
                             <p className="text-zinc-400 text-sm leading-relaxed">{project.description || "No description provided."}</p>
                         </div>
                         
                         <div className="space-y-6">
                             {project.contentType && (
                                 <div>
                                     <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Content Type</h4>
                                     <span className="inline-block px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs font-medium text-white shadow-lg">
                                         {project.contentType}
                                     </span>
                                 </div>
                             )}

                             {project.subjectMatter && (
                                 <div>
                                     <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Subject Matter</h4>
                                     <span className="inline-block px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs font-medium text-white shadow-lg">
                                         {project.subjectMatter}
                                     </span>
                                 </div>
                             )}

                             {project.softwareUsed && project.softwareUsed.length > 0 && (
                                 <div>
                                     <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Editing Software</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {project.softwareUsed.map(tool => (
                                             <div key={tool} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300">
                                                 <ToolIcon name={tool} className="w-4 h-4" />
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
  const headerOpacity = useTransform(scrollY, [200, 350], [0, 1]);
  const headerY = useTransform(scrollY, [200, 350], [-80, 0]);
  
  useEffect(() => { 
      if (isPreview) setShowIntro(false); 
      if (!isPreview && data.uid) {
          trackPortfolioView(data.uid);
      }
  }, [isPreview, data.uid]);

  const allTools = [...(data.tools || [])];
  if (data.primaryTool && !allTools.includes(data.primaryTool)) { 
      allTools.unshift(data.primaryTool); 
  }
  const secondaryTools = allTools.filter(t => t !== data.primaryTool);
  const hasAnyTools = data.primaryTool || secondaryTools.length > 0 || (data.aiTools && data.aiTools.length > 0);

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
        <a 
            href={`mailto:${data.contactEmail}`} 
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full text-xs font-bold uppercase transition-all pointer-events-auto backdrop-blur-md border border-white/10"
        >
            <Mail size={14} /> Hire Me
        </a>
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 pb-32">
          {/* Hero Section */}
          <div className="min-h-screen flex flex-col justify-center py-20">
              <HeroContent data={data} isMobile={false} />
          </div>

          {/* Showreel Section */}
          {(data.showreelLink || data.showreelThumbnail) && (
             <div className="mb-32">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }}
                    className="mb-8 flex items-center gap-4"
                >
                    <div className="h-px flex-1 bg-zinc-800"></div>
                    <h2 className="text-sm font-display font-bold text-zinc-500 tracking-[0.2em] uppercase">Featured Reel</h2>
                    <div className="h-px flex-1 bg-zinc-800"></div>
                 </motion.div>
                 <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
             </div>
          )}
          
          {/* Tools & Skills Grid */}
          {hasAnyTools && (
               <div className="mb-32">
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {data.primaryTool && <PrimaryToolCard toolName={data.primaryTool} />}
                        {secondaryTools.map(tool => (
                            <motion.div 
                                key={tool}
                                initial={{ opacity: 0, scale: 0.9 }} 
                                whileInView={{ opacity: 1, scale: 1 }} 
                                viewport={{ once: true }}
                                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 transition-colors group aspect-square"
                            >
                                <ToolIcon name={tool} className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs font-medium text-zinc-400 group-hover:text-white">{tool}</span>
                            </motion.div>
                        ))}
                        {(data.aiTools || []).map(tool => (
                             <motion.div 
                                key={tool}
                                initial={{ opacity: 0, scale: 0.9 }} 
                                whileInView={{ opacity: 1, scale: 1 }} 
                                viewport={{ once: true }}
                                className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-indigo-900/20 transition-colors group aspect-square"
                            >
                                <div className="absolute top-2 right-2"><Sparkles size={10} className="text-indigo-400" /></div>
                                <ToolIcon name={tool} className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs font-medium text-indigo-200">{tool}</span>
                            </motion.div>
                        ))}
                   </div>
               </div>
          )}

          {/* Projects Grid */}
          {data.projects && data.projects.length > 0 && (
              <div className="space-y-16">
                   <motion.div 
                        initial={{ opacity: 0 }} 
                        whileInView={{ opacity: 1 }} 
                        viewport={{ once: true }}
                        className="flex justify-between items-end border-b border-zinc-800 pb-4"
                    >
                        <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter">Selected Works</h2>
                        <span className="text-zinc-500 font-display font-bold text-sm tracking-widest hidden md:block">
                            {String(data.projects.length).padStart(2, '0')} PROJECTS
                        </span>
                   </motion.div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-[minmax(300px,auto)]">
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
          
          {/* Footer */}
          <footer className="mt-32 pt-16 border-t border-zinc-900 text-center space-y-8">
               <h2 className="text-2xl font-display font-bold text-zinc-700 uppercase tracking-widest">Thanks for watching</h2>
               <div className="flex justify-center gap-6">
                    {Object.entries(data.socials).map(([key, val]) => {
                        if (!val) return null;
                         const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                        return (
                            <a 
                                key={key} 
                                href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} 
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <Icon size={20} />
                            </a>
                        )
                    })}
               </div>
               <div className="pb-8 text-zinc-800 text-[10px] font-bold uppercase tracking-widest">
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
