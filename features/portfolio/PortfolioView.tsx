import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, Variants } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Globe, Maximize2, Star, Sparkles, MonitorPlay, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { PortfolioData, Project } from '../../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, trackPortfolioClick, getDriveId, getDropboxDirectLink } from '../../lib/utils';

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
        if (src.includes('dropbox.com') || src.includes('dl.dropboxusercontent.com')) return 'dropbox';
        return 'direct';
    }, [src]);

    const directSrc = type === 'dropbox' ? getDropboxDirectLink(src) || src : src;

    useEffect(() => {
        // Autoplay logic for direct video tags
        if ((type === 'direct' || type === 'dropbox') && videoRef.current) {
            videoRef.current.muted = true; // Ensure muted for autoplay
            if (isInView) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) playPromise.catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isInView, type, directSrc]);

    const getEmbedSrc = () => {
        if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            // Autoplay=1, mute=1 for autoplay policy
            return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&showinfo=0&modestbranding=1&enablejsapi=1`;
        }
        if (type === 'vimeo') {
             const vId = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)?.[1];
             return `https://player.vimeo.com/video/${vId}?autoplay=1&muted=1&loop=1&background=1`;
        }
        if (type === 'drive') {
             const dId = getDriveId(src);
             // Drive preview doesn't reliably support autoplay params
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
            {/* Ambient Glow - Sampled from Thumbnail */}
            <div className="absolute -inset-1 sm:-inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0">
                <img 
                    src={thumbnail} 
                    className="w-full h-full object-cover blur-3xl scale-105 opacity-60 rounded-[3rem]" 
                    aria-hidden="true" 
                />
            </div>

            <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl z-10">
                {/* Loading/Buffering State */}
                <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 ease-in-out ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}>
                    <img src={thumbnail || "https://picsum.photos/800/450"} className="w-full h-full object-cover" alt="Loading" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                </div>

                {/* Player */}
                {type === 'direct' || type === 'dropbox' ? (
                    <video 
                        ref={videoRef}
                        key={directSrc}
                        src={directSrc}
                        className="w-full h-full object-cover"
                        loop
                        muted={isMuted} // Controlled by state
                        playsInline
                        preload="auto"
                        crossOrigin="anonymous"
                        onCanPlay={() => setIsVideoReady(true)}
                        onWaiting={() => setIsVideoReady(false)} 
                        onPlaying={() => setIsVideoReady(true)}
                        controls={false}
                    />
                ) : (
                    <iframe 
                        src={getEmbedSrc()}
                        className="w-full h-full pointer-events-none" // Disable interaction to hide controls overlay
                        allow="autoplay; fullscreen; picture-in-picture"
                        title="Showreel"
                        onLoad={() => setTimeout(() => setIsVideoReady(true), 1500)} // Artificial delay for iframe load
                    />
                )}

                {/* Mute Toggle - Only effective for native video or if we had API access. For iframe, visual indicator mostly. */}
                {(type === 'direct' || type === 'dropbox') && isVideoReady && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted(!isMuted);
                            if (videoRef.current) videoRef.current.muted = !isMuted;
                        }}
                        className="absolute bottom-6 right-6 z-30 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                    >
                        {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                    </button>
                )}
            </div>
        </motion.div>
    );
});

const AmbientProjectCard: React.FC<{ project: Project; onClick: () => void }> = React.memo(({ project, onClick }) => {
    const isVideo = project.type === 'video';
    const isPortrait = project.aspectRatio === '9:16';
    
    // Masonry-like grid sizing
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
    const dropboxDirect = getDropboxDirectLink(project.link);
    
    // Calculate aspect ratio for inline styles
    const getAspectRatioStyle = () => {
        switch(project.aspectRatio) {
            case '9:16': return { aspectRatio: '9/16' };
            case '4:3': return { aspectRatio: '4/3' };
            case '1:1': return { aspectRatio: '1/1' };
            case '16:9': 
            default: return { aspectRatio: '16/9' };
        }
    };

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
                className="w-full h-full md:max-w-7xl md:h-[85vh] bg-[#050505] md:border border-zinc-800 rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative" 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
            >
                {/* Video/Image Section - Dynamic Aspect Ratio Container */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800">
                    <div className="w-full h-full flex items-center justify-center p-0 md:p-4">
                         {project.type === 'video' ? (
                            <div 
                                className="relative w-full max-h-full mx-auto bg-black"
                                style={{ 
                                    ...getAspectRatioStyle(),
                                    maxWidth: project.aspectRatio === '9:16' ? '50vh' : '100%', // Prevent super tall mobile portrait on desktop
                                }}
                            >
                                {dropboxDirect ? (
                                    <video 
                                        src={dropboxDirect} 
                                        controls 
                                        autoPlay 
                                        className="w-full h-full object-contain" 
                                        playsInline 
                                        crossOrigin="anonymous"
                                    />
                                ) : driveEmbed ? (
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
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>
                         ) : (
                            <img src={project.link || project.thumbnail} className="w-full h-full object-contain" alt={project.title} />
                         )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="w-full md:w-[400px] bg-zinc-900/50 backdrop-blur-xl border-l border-zinc-800 p-8 flex flex-col gap-6 overflow-y-auto">
                    <div>
                         {project.contentType && <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2 block">{project.contentType}</span>}
                         <h2 className="text-3xl font-display font-bold text-white leading-tight mb-4">{project.title}</h2>
                         <p className="text-zinc-400 text-sm leading-relaxed">{project.description}</p>
                    </div>

                    <div className="h-px bg-zinc-800 w-full" />

                    <div className="space-y-4">
                        {project.softwareUsed && project.softwareUsed.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Software</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.softwareUsed.map(tool => (
                                        <div key={tool} className="px-2 py-1 bg-black rounded border border-zinc-800 text-[10px] text-zinc-300 font-medium">
                                            {tool}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                         
                        <div className="pt-4">
                            <a 
                                href={project.link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                            >
                                Open Original <MonitorPlay size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
    const [showIntro, setShowIntro] = useState(!isPreview);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Smooth scroll progress for parallax effects
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    useEffect(() => {
        if (!isPreview && data.uid) {
            trackPortfolioView(data.uid);
        }
    }, [data.uid, isPreview]);

    // Disable body scroll when lightbox is open
    useEffect(() => {
        if (selectedProject) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [selectedProject]);

    const handleIntroComplete = () => {
        setShowIntro(false);
    };

    if (!data) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div ref={containerRef} className="bg-[#050505] min-h-screen text-white font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
             <AnimatePresence>
                {showIntro && <IntroOverlay name={data.name} onComplete={handleIntroComplete} />}
             </AnimatePresence>

             <AnimatePresence>
                {selectedProject && <Lightbox project={selectedProject} onClose={() => setSelectedProject(null)} />}
             </AnimatePresence>

             {/* Header / Nav */}
             <motion.header 
                className="fixed top-0 left-0 right-0 z-40 px-6 py-6 flex justify-between items-center mix-blend-difference pointer-events-none"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, duration: 0.8 }}
             >
                 <div className="text-white font-bold text-xl tracking-tighter pointer-events-auto cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
                     {data.name?.split(' ')[0].toUpperCase() || 'PORTFOLIO'}
                 </div>
                 {data.availability.status && (
                     <a href={`mailto:${data.contactEmail}`} className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                         Available for Work
                     </a>
                 )}
             </motion.header>

             <div className="max-w-[1600px] mx-auto px-4 md:px-8 relative z-0">
                 {/* Hero Section */}
                 <section className="min-h-screen flex items-center justify-center pt-20">
                     <HeroContent data={data} isMobile={window.innerWidth < 768} />
                 </section>

                 {/* Showreel Section */}
                 {data.showreelLink && (
                     <section className="py-20 md:py-32">
                         <div className="max-w-6xl mx-auto space-y-8">
                             <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                viewport={{ once: true }} 
                                className="flex items-center gap-4 mb-8"
                            >
                                 <div className="h-px bg-zinc-800 flex-1" />
                                 <span className="text-zinc-500 font-display font-bold text-2xl uppercase tracking-widest">Showreel</span>
                                 <div className="h-px bg-zinc-800 flex-1" />
                             </motion.div>
                             <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                         </div>
                     </section>
                 )}

                 {/* Projects Grid */}
                 {data.projects && data.projects.length > 0 && (
                     <section className="py-20 md:py-32">
                         <motion.h3 
                            className="text-[10vw] md:text-[6vw] font-display font-black text-white/5 uppercase leading-none text-center mb-16 select-none"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                         >
                            Selected Works
                         </motion.h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-[300px] md:auto-rows-[400px]">
                             {data.projects.map((project) => (
                                 <AmbientProjectCard 
                                    key={project.id} 
                                    project={project} 
                                    onClick={() => setSelectedProject(project)} 
                                 />
                             ))}
                         </div>
                     </section>
                 )}
                 
                 {/* Tools & Skills */}
                 {(data.tools?.length > 0 || data.primaryTool) && (
                     <section className="py-20 border-t border-zinc-900">
                         <div className="max-w-4xl mx-auto text-center space-y-12">
                             <div className="space-y-4">
                                 <h3 className="text-3xl font-display font-bold uppercase tracking-tight">Technical Arsenal</h3>
                                 <p className="text-zinc-500">The tools I use to bring ideas to life.</p>
                             </div>
                             
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-center">
                                 {data.primaryTool && <PrimaryToolCard toolName={data.primaryTool} />}
                                 {data.tools.filter(t => t !== data.primaryTool).map(tool => (
                                     <motion.div 
                                        key={tool}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center gap-4 hover:bg-zinc-800 transition-colors"
                                     >
                                         <ToolIcon name={tool} className="w-8 h-8" />
                                         <span className="text-sm font-bold text-zinc-300">{tool}</span>
                                     </motion.div>
                                 ))}
                                 {data.aiTools?.map(tool => (
                                      <motion.div 
                                        key={tool}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="bg-zinc-900/50 border border-indigo-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 hover:bg-zinc-900 transition-colors relative group"
                                     >
                                         <div className="absolute top-2 right-2 text-indigo-500 opacity-50"><Sparkles size={12} /></div>
                                         <ToolIcon name={tool} className="w-8 h-8" />
                                         <span className="text-sm font-bold text-zinc-300">{tool}</span>
                                     </motion.div>
                                 ))}
                             </div>
                         </div>
                     </section>
                 )}

                 {/* Footer */}
                 <footer className="py-20 border-t border-zinc-900 mt-20">
                     <div className="flex flex-col items-center gap-8 text-center">
                         <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter">Let's Create</h2>
                         <a href={`mailto:${data.contactEmail}`} className="text-xl md:text-2xl text-zinc-400 hover:text-white transition-colors border-b border-zinc-700 hover:border-white pb-1">
                             {data.contactEmail}
                         </a>
                         <div className="flex gap-6 mt-8">
                            {Object.entries(data.socials).map(([key, val]) => {
                                if (!val) return null;
                                const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                return (
                                    <a 
                                        key={key} 
                                        href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <Icon size={24} />
                                    </a>
                                )
                            })}
                         </div>
                         <p className="text-zinc-700 text-xs mt-12 uppercase tracking-widest">
                             © {new Date().getFullYear()} {data.name}. Built with Frames.
                         </p>
                     </div>
                 </footer>
             </div>
        </div>
    );
};