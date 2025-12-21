import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
    Mail, Instagram, Twitter, Linkedin, Youtube, Globe, MapPin, 
    Volume2, VolumeX, Play, ArrowUpRight, X, Check, Zap, Layers, AlertTriangle 
} from 'lucide-react';
import { PortfolioData, Project, INITIAL_DATA } from '../../types';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDirectVideoUrl, isNativeVideo } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Helper Functions ---

const ensureUrl = (url: string, key?: string): string => {
    if (!url) return '';
    let processed = url.trim();
    if (processed.match(/^[a-zA-Z]+:\/\//)) return processed;
    if (key === 'email' || (processed.includes('@') && !processed.includes('/') && !key)) return `mailto:${processed}`;
    if (key) {
        const k = key.toLowerCase();
        const cleanHandle = processed.startsWith('@') ? processed.substring(1) : processed;
        const noProtocol = processed.replace(/^https?:\/\//, '');
        if (k === 'instagram' && !processed.includes('instagram.com')) return `https://instagram.com/${cleanHandle}`;
        if (k === 'twitter' && !processed.includes('twitter.com') && !processed.includes('x.com')) return `https://twitter.com/${cleanHandle}`;
        if (k === 'linkedin' && !processed.includes('linkedin.com')) return `https://linkedin.com/in/${cleanHandle}`;
        if (k === 'youtube' && !processed.includes('youtube.com') && !processed.includes('youtu.be')) return `https://youtube.com/${cleanHandle}`;
        if (k === 'discord') {
             if (processed.includes('discord.com') || processed.includes('discord.gg')) return `https://${noProtocol}`;
             if (/^\d+$/.test(cleanHandle)) return `https://discord.com/users/${cleanHandle}`;
             return `https://discord.gg/${cleanHandle}`;
        }
    }
    return `https://${processed}`;
};

// --- Helper Components ---

const ToolIcon = React.memo(({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
    const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
    const [imgSrc, setImgSrc] = useState(tool ? `https://cdn.simpleicons.org/${tool.slug}/white` : '');
    if (!tool) return <span className={`flex items-center justify-center font-bold text-zinc-600 text-[10px] uppercase border border-zinc-800 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    return <img src={imgSrc} alt={name} className={`${className} object-contain opacity-70 group-hover:opacity-100 transition-opacity`} onError={(e) => (e.currentTarget.style.display = 'none')} />;
});

const VideoPlayer: React.FC<{ 
    src: string; 
    thumbnail: string; 
    autoplay?: boolean; 
    muted?: boolean;
    controls?: boolean;
    aspectRatio?: string;
    className?: string;
    onToggleMute?: () => void;
    ambience?: boolean;
    isShowreel?: boolean;
    objectFit?: 'cover' | 'contain';
}> = ({ src, thumbnail, autoplay = false, muted = true, controls = false, aspectRatio = '16:9', className = '', onToggleMute, ambience = false, isShowreel = false, objectFit = 'cover' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const ambienceRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [detectedRatio, setDetectedRatio] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    const normalizedSrc = useMemo(() => getDirectVideoUrl(src), [src]);
    const isNative = useMemo(() => isNativeVideo(normalizedSrc), [normalizedSrc]);

    // Force failure resets
    useEffect(() => {
        setHasError(false);
        setIsLoaded(false);
        setDetectedRatio(null);
    }, [src]);

    const effectiveAspectRatio = detectedRatio || aspectRatio || '16:9';
    const cssAspectRatio = useMemo(() => effectiveAspectRatio.replace(':', '/'), [effectiveAspectRatio]);
    
    // Sync Muted
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = muted;
            videoRef.current.defaultMuted = muted;
        }
    }, [muted]);

    // SHOWREEL SPECIFIC LOGIC
    if (isShowreel) {
        return (
            <div className={`relative bg-[#050505] overflow-hidden rounded-2xl ${className}`} style={{ aspectRatio: cssAspectRatio }}>
                {ambience && !hasError && (
                    <video
                        ref={ambienceRef}
                        src={normalizedSrc}
                        className="absolute inset-0 w-full h-full object-cover blur-[60px] opacity-50 scale-110 pointer-events-none -z-10"
                        muted
                        loop
                        playsInline
                    />
                )}

                <AnimatePresence>
                    {!isLoaded && (
                        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 z-10 bg-[#09090b]">
                            {thumbnail && <img src={thumbnail} className="w-full h-full object-cover opacity-80" alt="Poster" />}
                        </motion.div>
                    )}
                </AnimatePresence>

                <video 
                    ref={videoRef}
                    src={normalizedSrc}
                    className="w-full h-full object-cover relative z-0"
                    loop 
                    muted={muted}
                    playsInline 
                    autoPlay={autoplay}
                    preload="auto"
                    onLoadedMetadata={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                    onSuspend={(e) => { if(autoplay) e.currentTarget.play().catch(() => {}) }}
                />

                {hasError && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                         {thumbnail && <img src={thumbnail} className="w-full h-full object-cover opacity-60" alt="Static Fallback" />}
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                                 <Play size={32} className="text-white fill-white" />
                             </div>
                         </div>
                     </div>
                )}

                 {onToggleMute && !hasError && (
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                        className="absolute bottom-6 right-6 z-30 p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all border border-white/10"
                    >
                        {muted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                    </motion.button>
                )}
            </div>
        )
    }

    // --- STANDARD PROJECT PLAYER (Previous Logic) ---
    
    // --- Autoplay Logic ---
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !autoplay || !isNative || hasError || isShowreel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        video.muted = muted;
                        const playPromise = video.play();
                        if (playPromise !== undefined) {
                            playPromise.catch((e) => { 
                                 if (!video.muted) {
                                     video.muted = true;
                                     video.play().catch(e => {});
                                 }
                            });
                        }
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(video);
        return () => observer.disconnect();
    }, [autoplay, isNative, normalizedSrc, muted, hasError, isShowreel]);

    const getEmbedSrc = () => {
        const auto = autoplay ? 1 : 0;
        const mute = muted ? 1 : 0;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        if (normalizedSrc.includes('youtube.com') || normalizedSrc.includes('youtu.be')) {
            const match = normalizedSrc.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            const ytId = match?.[2];
            if (!ytId) return normalizedSrc;
            const forceMute = (auto && muted) ? 1 : mute;
            return `https://www.youtube.com/embed/${ytId}?autoplay=${auto}&mute=${forceMute}&controls=${controls ? 1 : 0}&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&showinfo=0&enablejsapi=1&origin=${origin}`;
        }
        if (normalizedSrc.includes('vimeo.com')) {
            const match = normalizedSrc.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
            const vId = match?.[1];
            if (!vId) return normalizedSrc;
            const isBackground = !controls && muted; 
            return `https://player.vimeo.com/video/${vId}?autoplay=${auto}&muted=${mute}&loop=1&background=${isBackground ? 1 : 0}&playsinline=1`;
        }
        return normalizedSrc;
    };

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const { videoWidth, videoHeight } = e.currentTarget;
        if (videoWidth && videoHeight) {
            const r = videoWidth / videoHeight;
            if (Math.abs(r - 9/16) < 0.05) setDetectedRatio('9:16');
            else if (Math.abs(r - 16/9) < 0.05) setDetectedRatio('16:9');
            else if (Math.abs(r - 4/3) < 0.05) setDetectedRatio('4:3');
            else if (Math.abs(r - 1) < 0.05) setDetectedRatio('1:1');
            else setDetectedRatio(`${videoWidth}/${videoHeight}`);
        }
        setIsLoaded(true);
    };

    if (isNative) {
        return (
             <div 
                className={`relative bg-[#050505] ${className} ${hasError ? 'border border-red-900/50 rounded-2xl' : ''}`} 
                style={controls ? {} : { aspectRatio: cssAspectRatio }}
            >
                {ambience && !hasError && (
                    <video
                        ref={ambienceRef}
                        src={normalizedSrc}
                        className="absolute inset-0 w-full h-full object-cover blur-[50px] opacity-60 scale-110 pointer-events-none transition-opacity duration-1000 -z-10"
                        muted
                        loop
                        playsInline
                        aria-hidden="true"
                    />
                )}
                <AnimatePresence>
                    {!isLoaded && !hasError && (
                        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-10 bg-[#09090b] flex items-center justify-center rounded-2xl overflow-hidden">
                            {thumbnail && <img src={thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60 blur-lg scale-110" alt="Thumbnail" />}
                        </motion.div>
                    )}
                </AnimatePresence>
                {!hasError && (
                    <video 
                        key={normalizedSrc}
                        ref={videoRef}
                        src={normalizedSrc}
                        className={`relative w-full h-full object-${objectFit} z-10 rounded-2xl bg-black`} 
                        loop 
                        autoPlay={autoplay}
                        muted={muted}
                        playsInline 
                        preload={autoplay ? "auto" : "metadata"}
                        controls={controls}
                        onLoadedMetadata={handleLoadedMetadata}
                        onError={() => { setHasError(true); setIsLoaded(true); }}
                        crossOrigin="anonymous"
                    />
                )}
                 {onToggleMute && !hasError && !controls && (
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                        className="absolute bottom-4 right-4 z-20 p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all border border-white/10"
                    >
                        {muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                    </motion.button>
                )}
                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-zinc-900 rounded-2xl overflow-hidden" style={{ aspectRatio: cssAspectRatio }}>
                        {thumbnail && <img src={thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" alt="Fallback" />}
                        <div className="relative z-10 bg-black/80 p-4 rounded-xl backdrop-blur-sm border border-zinc-700/30 flex flex-col items-center gap-2">
                             <span className="text-zinc-400 font-bold text-[10px] tracking-widest uppercase text-center leading-relaxed">Video unavailable.<br/>Please check link access.</span>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div 
            className={`relative bg-[#050505] overflow-hidden rounded-2xl ${className}`} 
            style={{ aspectRatio: cssAspectRatio }}
        >
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div 
                        initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-10 bg-[#09090b] flex items-center justify-center"
                    >
                        {thumbnail && <img src={thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60 blur-lg scale-110" alt="Thumbnail" />}
                    </motion.div>
                )}
            </AnimatePresence>

            <iframe 
                src={getEmbedSrc()} 
                className="w-full h-full pointer-events-none"
                style={{ pointerEvents: controls ? 'auto' : 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen 
                onLoad={() => setIsLoaded(true)} 
            />

            {onToggleMute && ( 
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                    className="absolute bottom-4 right-4 z-20 p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all border border-white/10"
                >
                    {muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                </motion.button>
            )}
        </div>
    );
};

// --- Animations ---

const IntroOverlay: React.FC<{ data: PortfolioData; onComplete: () => void; isImageLoaded: boolean }> = ({ data, onComplete, isImageLoaded }) => {
    useEffect(() => {
        if (isImageLoaded) {
            const timer = setTimeout(onComplete, 2600); 
            return () => clearTimeout(timer);
        }
    }, [onComplete, isImageLoaded]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        },
        exit: { 
            opacity: 0, 
            y: -20, 
            filter: 'blur(10px)',
            transition: { duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] as [number, number, number, number] } 
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 30, opacity: 0, scale: 0.95 },
        visible: { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } 
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={isImageLoaded ? "visible" : "hidden"}
            exit="exit"
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6"
        >
            <motion.div variants={itemVariants} className="mb-8">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-zinc-800 shadow-2xl">
                   {isImageLoaded && <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />}
                </div>
            </motion.div>
            
            <div className="text-center space-y-3">
                <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-display font-black uppercase text-white tracking-tight">
                    {data.name}
                </motion.h1>
                <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
                     <div className="h-px w-12 bg-zinc-700" />
                     <span className="text-lg md:text-xl font-medium text-zinc-400 tracking-wide uppercase">
                        {data.role || 'Video Editor'}
                     </span>
                </motion.div>
            </div>
        </motion.div>
    );
};

const ProjectCard: React.FC<{ project: Project; index: number; onClick: () => void; className?: string }> = ({ project, index, onClick, className = '' }) => {
    const displayAspectRatio = useMemo(() => {
        if (project.aspectRatio === '9:16') return '9/16'; 
        return project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9';
    }, [project.aspectRatio]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            onClick={onClick}
            className={`group cursor-pointer relative rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg ${className}`}
            style={{ aspectRatio: displayAspectRatio }}
        >
            <div className="absolute top-0 left-0 p-4 text-7xl font-black text-white/5 select-none pointer-events-none z-0 leading-none">
                {String(index + 1).padStart(2, '0')}
            </div>

            <img 
                src={project.thumbnail} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 relative z-10" 
                alt={project.title}
                loading="lazy"
            />
            
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 flex flex-col justify-end min-h-[40%]">
                 <h3 className="font-display font-bold text-lg text-white leading-tight truncate drop-shadow-md">{project.title}</h3>
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 opacity-80 border border-zinc-700/50 self-start px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                    {project.contentType || 'Video'}
                 </span>
            </div>

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30 backdrop-blur-[1px]">
                 <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
                     <Play size={24} fill="currentColor" className="ml-1" />
                 </div>
            </div>
        </motion.div>
    );
};

// --- Main View ---

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
    const safeData = useMemo(() => ({ ...INITIAL_DATA, ...data }), [data]);
    const [introComplete, setIntroComplete] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isShowreelMuted, setIsShowreelMuted] = useState(true);
    
    useEffect(() => {
        if (safeData.profileImage) {
            const img = new Image();
            img.src = safeData.profileImage;
            img.onload = () => setIsImageLoaded(true);
            img.onerror = () => setIsImageLoaded(true); 
        } else {
            setIsImageLoaded(true);
        }
    }, [safeData.profileImage]);

    const categorizedProjects = useMemo(() => {
        const projects = safeData.projects || [];
        const albums = safeData.albums || [];
        const mapping = new Map<string, Project[]>();
        const uncategorized: Project[] = [];
        albums.forEach(a => mapping.set(a.id, []));
        projects.forEach(p => {
            if (p.albumId && mapping.has(p.albumId)) {
                mapping.get(p.albumId)?.push(p);
            } else {
                uncategorized.push(p);
            }
        });
        const result: { title: string; projects: Project[] }[] = [];
        albums.forEach(a => {
            const projs = mapping.get(a.id);
            if (projs && projs.length > 0) result.push({ title: a.title, projects: projs });
        });
        if (uncategorized.length > 0) {
            const title = albums.length > 0 ? "Other Work" : "My Work";
            result.push({ title, projects: uncategorized });
        }
        return result;
    }, [safeData.projects, safeData.albums]);

    useEffect(() => {
        if (!isPreview && safeData.uid) trackPortfolioView(safeData.uid);
        document.body.style.overflow = selectedProject || !introComplete ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; }
    }, [selectedProject, safeData.uid, isPreview, introComplete]);

    return (
        <div className="bg-[#050505] min-h-screen w-full relative text-zinc-100 font-sans selection:bg-white/20 selection:text-white">
            <AnimatePresence>
                {!introComplete && (
                    <IntroOverlay data={safeData} isImageLoaded={isImageLoaded} onComplete={() => setIntroComplete(true)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedProject && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                        onClick={() => setSelectedProject(null)}
                    >
                        <motion.button 
                            whileHover={{ rotate: 90 }}
                            onClick={() => setSelectedProject(null)}
                            className="absolute top-6 right-6 z-50 p-2 bg-white/10 rounded-full text-white hover:bg-white hover:text-black transition-colors"
                        >
                            <X size={24} />
                        </motion.button>
                        
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-7xl max-h-[90vh] flex flex-col lg:flex-row bg-[#09090b] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex-1 bg-black relative flex items-center justify-center min-h-[40vh] lg:min-h-0 overflow-hidden p-0 lg:p-4 self-stretch">
                                <div className="relative w-full h-full flex items-center justify-center">
                                     <VideoPlayer 
                                        src={selectedProject.link} 
                                        thumbnail={selectedProject.thumbnail} 
                                        autoplay={false}
                                        muted={false} 
                                        controls={true}
                                        aspectRatio={selectedProject.aspectRatio}
                                        objectFit="contain"
                                        className="w-full h-full mx-auto"
                                    />
                                </div>
                            </div>
                            
                            <div className="w-full lg:w-[400px] p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto bg-[#09090b] shrink-0">
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 leading-tight">{selectedProject.title}</h2>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-700">{selectedProject.contentType}</span>
                                    {selectedProject.softwareUsed?.map(tool => (
                                        <span key={tool} className="px-3 py-1 rounded-full bg-zinc-900 text-xs text-zinc-500 border border-zinc-800">{tool}</span>
                                    ))}
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-8 font-light tracking-wide">{selectedProject.description}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: introComplete ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col lg:block min-h-screen"
            >
                <aside className="
                    w-full lg:w-[35%] xl:w-[32%] 
                    lg:fixed lg:top-0 lg:left-0 lg:bottom-0 
                    lg:overflow-y-auto custom-scrollbar
                    bg-[#050505] border-b lg:border-b-0 lg:border-r border-zinc-900 
                    p-8 md:p-12 xl:p-16 
                    flex flex-col lg:justify-between gap-12 lg:gap-8
                    z-20
                ">
                    <div className="space-y-10 lg:space-y-12">
                        <div className="relative inline-block">
                             <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-zinc-800 shadow-2xl ring-4 ring-zinc-900/50">
                                <img src={safeData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                            {safeData.availability?.status && (
                                <div className="absolute bottom-2 right-2 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-green-500 rounded-full border-[3px] border-[#050505] flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full opacity-80" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl lg:text-8xl font-display font-black text-white tracking-tighter leading-[0.85] uppercase">
                                {safeData.name}
                            </h1>
                            <p className="text-xl font-medium text-zinc-500">{safeData.role}</p>
                            <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-600 uppercase tracking-widest pt-2">
                                {safeData.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-white"/>
                                        <span>{safeData.location}</span>
                                    </div>
                                )}
                                {safeData.languages && (
                                    <div className="flex items-center gap-1.5">
                                        <Globe size={14} className="text-white"/>
                                        <span>{safeData.languages}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-light max-w-sm">
                            {safeData.bio}
                        </p>

                        <div className="flex flex-wrap gap-3 pb-2">
                            {safeData.socials && Object.entries(safeData.socials).map(([key, val]) => {
                                if (!val) return null;
                                const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail, discord: Globe }[key.toLowerCase()] || Globe;
                                const url = ensureUrl(val as string, key);
                                return (
                                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-white hover:border-white transition-all duration-300 group">
                                        <Icon size={20} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                )
                            })}
                        </div>
                    </div>

                    <div className="hidden lg:block space-y-4 pt-4">
                         <div className="w-full h-px bg-zinc-900" />
                         <div className="flex justify-between items-end">
                            <a href={`mailto:${safeData.contactEmail}`} className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                                <span className="text-sm font-medium">Get in touch</span>
                                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
                            </a>
                            <span className="text-left text-[10px] text-zinc-700 uppercase tracking-widest font-bold">© {new Date().getFullYear()}</span>
                         </div>
                    </div>
                </aside>

                <main className="w-full lg:ml-[35%] xl:ml-[32%] lg:w-auto relative z-10 bg-[#050505]">
                    
                    {safeData.showreelLink && (
                        <section className="p-6 md:p-12 xl:p-16 border-b border-zinc-900/50">
                            <div className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
                                <h2 className="text-3xl font-display font-bold text-white tracking-tight">Showreel</h2>
                            </div>
                            
                            <div className="max-w-2xl mx-auto w-full aspect-video md:aspect-[2.35/1] relative group overflow-visible">
                                <VideoPlayer 
                                    src={safeData.showreelLink} 
                                    thumbnail={safeData.showreelThumbnail} 
                                    autoplay={true} 
                                    muted={isShowreelMuted}
                                    onToggleMute={() => setIsShowreelMuted(!isShowreelMuted)}
                                    ambience={true}
                                    isShowreel={true}
                                    className="w-full h-full scale-[1.01] group-hover:scale-100 transition-transform duration-1000"
                                />
                            </div>
                        </section>
                    )}

                    <div className="p-5 md:p-10 xl:p-14 pb-24">
                        {categorizedProjects.length > 0 && categorizedProjects.map((section, idx) => (
                            <section key={idx} className="mb-16 last:mb-0">
                                <div className="flex items-end justify-between mb-6">
                                    <h2 className="text-2xl md:text-4xl font-display font-bold text-white tracking-tight uppercase">{section.title}</h2>
                                    <div className="h-px flex-1 bg-zinc-900 ml-6 relative top-[-8px] hidden md:block" />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {section.projects.map((project, projIdx) => (
                                        <ProjectCard 
                                            key={project.id} 
                                            project={project} 
                                            index={projIdx}
                                            onClick={() => setSelectedProject(project)} 
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                        
                        {categorizedProjects.length === 0 && (
                            <div className="p-12 text-center text-zinc-600 border border-zinc-900 border-dashed rounded-xl">
                                No projects to display.
                            </div>
                        )}

                        <section className="space-y-12 border-t border-zinc-900 pt-16 mt-16">
                             <div className="flex items-end gap-6 mb-8">
                                <h2 className="text-4xl font-display font-black text-white tracking-tight uppercase">Skills & Tools</h2>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                                 {safeData.primaryTool && (
                                     <div className="col-span-1 lg:col-span-5 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between group hover:border-zinc-600 transition-colors">
                                         <div>
                                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 block flex items-center gap-2">
                                                <Check size={14} strokeWidth={4} /> Primary Workflow
                                            </span>
                                            <h3 className="text-3xl font-bold text-white mb-2">{safeData.primaryTool}</h3>
                                            <p className="text-zinc-500 text-sm">Specialized expertise and daily driver for high-end production.</p>
                                         </div>
                                         <div className="mt-8">
                                             <div className="w-16 h-16 bg-black rounded-2xl border border-zinc-800 flex items-center justify-center">
                                                 <ToolIcon name={safeData.primaryTool} className="w-8 h-8 opacity-100" />
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 <div className="col-span-1 lg:col-span-7 grid grid-cols-1 gap-6">
                                     <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Layers size={18} className="text-zinc-500"/>
                                            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Software Stack</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {safeData.tools?.filter(t => t !== safeData.primaryTool).map(tool => (
                                                <div key={tool} className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
                                                    <ToolIcon name={tool} className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{tool}</span>
                                                </div>
                                            ))}
                                        </div>
                                     </div>

                                     {safeData.aiTools && safeData.aiTools.length > 0 && (
                                         <div className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-indigo-500/10 rounded-3xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Zap size={18} className="text-indigo-400"/>
                                                <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">AI Acceleration</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {safeData.aiTools.map(tool => (
                                                    <div key={tool} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200 hover:bg-indigo-500/20 transition-all">
                                                        <ToolIcon name={tool} className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{tool}</span>
                                                    </div>
                                                ))}
                                            </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </section>
                        
                        <div className="lg:hidden mt-20 pt-8 border-t border-zinc-900">
                            <h2 className="text-2xl font-display font-bold text-white mb-2">Let's Create.</h2>
                            <a href={`mailto:${safeData.contactEmail}`} className="text-lg text-zinc-500">{safeData.contactEmail}</a>
                        </div>
                    </div>

                </main>
            </motion.div>
        </div>
    );
};