import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
    Mail, Instagram, Twitter, Linkedin, Youtube, Globe, MapPin, 
    Volume2, VolumeX, Play, ArrowUpRight, X, Check, Zap, Layers 
} from 'lucide-react';
import { PortfolioData, Project, INITIAL_DATA } from '../../types';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDriveId, getDropboxDirectLink } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Helper Functions ---

const ensureUrl = (url: string, key?: string): string => {
    if (!url) return '';
    let processed = url.trim();
    
    // 1. If it has protocol, return as is.
    if (processed.match(/^[a-zA-Z]+:\/\//)) return processed;

    // 2. Email
    if (key === 'email' || (processed.includes('@') && !processed.includes('/') && !key)) {
        return `mailto:${processed}`;
    }

    // 3. Platform specific logic
    if (key) {
        const k = key.toLowerCase();
        const cleanHandle = processed.startsWith('@') ? processed.substring(1) : processed;

        if (k === 'instagram' && !processed.includes('instagram.com')) return `https://instagram.com/${cleanHandle}`;
        if (k === 'twitter' && !processed.includes('twitter.com') && !processed.includes('x.com')) return `https://twitter.com/${cleanHandle}`;
        if (k === 'linkedin' && !processed.includes('linkedin.com')) return `https://linkedin.com/in/${cleanHandle}`;
        if (k === 'youtube' && !processed.includes('youtube.com') && !processed.includes('youtu.be')) return `https://youtube.com/${cleanHandle}`;
        if (k === 'discord' && !processed.includes('discord.com') && !processed.includes('discord.gg')) return `https://discord.gg/${cleanHandle}`;
    }

    // 4. Generic fallback for domains
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
}> = ({ src, thumbnail, autoplay = false, muted = true, controls = false, aspectRatio = '16:9', className = '', onToggleMute }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [detectedRatio, setDetectedRatio] = useState<string | null>(null);
    
    // Reset detection when src changes
    useEffect(() => {
        setDetectedRatio(null);
        setIsLoaded(false);
    }, [src]);

    const effectiveAspectRatio = detectedRatio || aspectRatio || '16:9';
    const cssAspectRatio = useMemo(() => effectiveAspectRatio.replace(':', '/'), [effectiveAspectRatio]);
    
    const isVertical = useMemo(() => {
        try {
            const [w, h] = cssAspectRatio.split('/').map(Number);
            return w < h;
        } catch { return false; }
    }, [cssAspectRatio]);

    const type = useMemo(() => {
        if (!src) return 'none';
        const lower = src.toLowerCase();
        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
        if (lower.includes('vimeo.com')) return 'vimeo';
        if (lower.includes('drive.google.com')) return 'drive';
        if (lower.includes('dropbox.com')) return 'dropbox';
        return 'direct';
    }, [src]);

    // Force play when autoplay prop changes to true
    useEffect(() => {
        if ((type === 'direct' || type === 'dropbox') && videoRef.current) {
            if (autoplay) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Silent catch for autoplay blocks, we rely on the user or 'muted' to fix it
                        console.debug("Autoplay triggered via effect prevented:", error);
                    });
                }
            } else {
                videoRef.current.pause();
            }
        }
    }, [autoplay, type]);

    const getEmbedSrc = () => {
        const auto = autoplay ? 1 : 0;
        const mute = muted ? 1 : 0;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        if (type === 'youtube') {
            const match = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            const ytId = match?.[2];
            if (!ytId) return src;
            return `https://www.youtube.com/embed/${ytId}?autoplay=${auto}&mute=${mute}&controls=${controls ? 1 : 0}&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&showinfo=0&origin=${origin}`;
        }
        if (type === 'vimeo') {
            const match = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
            const vId = match?.[1];
            if (!vId) return src;
            return `https://player.vimeo.com/video/${vId}?autoplay=${auto}&muted=${mute}&loop=1&background=${controls ? 0 : 1}&playsinline=1`;
        }
        if (type === 'drive') return `https://drive.google.com/file/d/${getDriveId(src)}/preview`;
        return src;
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
    };

    const handleCanPlay = () => {
        setIsLoaded(true);
        if (autoplay && videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(e => console.debug("Autoplay onCanPlay blocked", e));
        }
    }

    return (
        <div 
            className={`
                relative bg-[#050505] overflow-hidden 
                ${isVertical ? 'w-full h-auto lg:w-auto lg:h-full' : 'w-full h-full'} 
                ${className}
            `} 
            style={{ aspectRatio: cssAspectRatio }}
        >
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div 
                        initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-10 bg-[#09090b] flex items-center justify-center"
                    >
                         {/* Thumbnail Blur Background */}
                        {thumbnail && <img src={thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60 blur-lg scale-110" alt="Thumbnail" />}
                    </motion.div>
                )}
            </AnimatePresence>

            {(type === 'direct' || type === 'dropbox') ? (
                <video 
                    key={src} // CRITICAL: Forces remount if URL changes, fixing stuck video states
                    ref={videoRef}
                    src={type === 'dropbox' ? (getDropboxDirectLink(src) || src) : src} 
                    className="w-full h-full object-cover"
                    loop 
                    muted={muted} 
                    playsInline 
                    autoPlay={autoplay}
                    preload="auto"
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlay={handleCanPlay}
                    controls={controls}
                />
            ) : (
                <iframe 
                    src={getEmbedSrc()} 
                    className="w-full h-full pointer-events-none"
                    style={{ pointerEvents: controls ? 'auto' : 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen 
                    onLoad={() => setIsLoaded(true)} 
                />
            )}

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
            const timer = setTimeout(onComplete, 2600); // Slightly longer for the new animation
            return () => clearTimeout(timer);
        }
    }, [onComplete, isImageLoaded]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
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

const ProjectCard: React.FC<{ project: Project; onClick: () => void; className?: string }> = ({ project, onClick, className = '' }) => {
    // Optimization: Clamp 9:16 vertical videos to a 3:4 aspect ratio in the grid view.
    // This reduces the massive vertical height while still preserving the "portrait" feel.
    // 9:16 = 0.56, 3:4 = 0.75. 
    const displayAspectRatio = useMemo(() => {
        if (project.aspectRatio === '9:16') return '3/4'; 
        return project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9';
    }, [project.aspectRatio]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            onClick={onClick}
            className={`group cursor-pointer relative rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-colors shadow-lg ${className}`}
            style={{ aspectRatio: displayAspectRatio }}
        >
            <img 
                src={project.thumbnail} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={project.title}
                loading="lazy"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                 <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg mb-2">
                         <Play size={20} fill="currentColor" className="ml-0.5" />
                     </div>
                     <h3 className="font-display font-bold text-2xl text-white leading-tight">{project.title}</h3>
                     <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full">
                        {project.contentType || 'Project'}
                     </span>
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
    
    // Responsive Columns State
    const [numColumns, setNumColumns] = useState(2);

    useEffect(() => {
        const handleResize = () => {
            // Switch to 3 columns on larger screens (2xl breakpoint approx 1536px)
            if (window.innerWidth >= 1536) setNumColumns(3);
            else setNumColumns(2);
        };
        
        // Initial check
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Preload Profile Image for Seamless Intro
    useEffect(() => {
        if (safeData.profileImage) {
            const img = new Image();
            img.src = safeData.profileImage;
            img.onload = () => setIsImageLoaded(true);
            img.onerror = () => setIsImageLoaded(true); // Proceed even if fail
        } else {
            setIsImageLoaded(true);
        }
    }, [safeData.profileImage]);

    // Intelligent Masonry Layout Calculation
    const projectColumns = useMemo(() => {
        const projects = safeData.projects || [];
        // Create buckets based on current numColumns
        const cols: Project[][] = Array.from({ length: numColumns }, () => []);
        const heights: number[] = new Array(numColumns).fill(0);

        projects.forEach(p => {
            // Calculate a "weight" representing visual height.
            // 9:16 is normally 1.77, but since we clamp it to 3:4 visually, we use 1.33 weight
            let weight = 1; 
            if (p.aspectRatio === '9:16') weight = 1.33;
            else if (p.aspectRatio === '16:9') weight = 0.56;
            else if (p.aspectRatio === '4:3') weight = 0.75;
            
            // Find the shortest column
            let shortestColIndex = 0;
            let minHeight = heights[0];
            
            for (let i = 1; i < numColumns; i++) {
                if (heights[i] < minHeight) {
                    minHeight = heights[i];
                    shortestColIndex = i;
                }
            }
            
            cols[shortestColIndex].push(p);
            heights[shortestColIndex] += weight;
        });
        
        return cols;
    }, [safeData.projects, numColumns]);

    useEffect(() => {
        if (!isPreview && safeData.uid) trackPortfolioView(safeData.uid);
        document.body.style.overflow = selectedProject || !introComplete ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; }
    }, [selectedProject, safeData.uid, isPreview, introComplete]);

    return (
        <div className="bg-[#050505] min-h-screen w-full relative text-zinc-100 font-sans selection:bg-white/20 selection:text-white">
            
            {/* Intro */}
            <AnimatePresence>
                {!introComplete && (
                    <IntroOverlay data={safeData} isImageLoaded={isImageLoaded} onComplete={() => setIntroComplete(true)} />
                )}
            </AnimatePresence>

            {/* Project Modal */}
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
                            {/* Video Container Logic */}
                            <div className="flex-1 bg-black relative flex items-center justify-center min-h-[40vh] lg:min-h-0 overflow-hidden">
                                <div 
                                    className={`
                                        flex items-center justify-center
                                        ${selectedProject.aspectRatio === '9:16' 
                                            ? 'h-full w-auto aspect-[9/16] lg:max-h-full' // 9:16 Desktop: fill height, auto width
                                            : 'w-full aspect-video lg:max-h-full' // 16:9 Desktop: fill width (contained by flex)
                                        }
                                        max-h-[85vh] max-w-full
                                    `}
                                >
                                    <VideoPlayer 
                                        src={selectedProject.link} 
                                        thumbnail={selectedProject.thumbnail} 
                                        autoplay={true} 
                                        muted={false} 
                                        controls={true}
                                        aspectRatio={selectedProject.aspectRatio}
                                    />
                                </div>
                            </div>

                            {/* Info Side */}
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

            {/* --- MAIN LAYOUT --- */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: introComplete ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col lg:flex-row min-h-screen"
            >
                {/* --- SIDEBAR --- */}
                <aside className="
                    w-full lg:w-[35%] xl:w-[32%] 
                    lg:h-screen lg:sticky lg:top-0 lg:overflow-hidden
                    bg-[#050505] border-b lg:border-b-0 lg:border-r border-zinc-900 
                    p-8 md:p-12 xl:p-16 
                    flex flex-col lg:justify-between gap-12 lg:gap-0
                    z-10
                ">
                    <div className="space-y-10 lg:space-y-12">
                        {/* Avatar with Status */}
                        <div className="relative inline-block">
                             <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-zinc-800 shadow-2xl ring-4 ring-zinc-900/50">
                                <img src={safeData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                            {/* Availability Indicator */}
                            {safeData.availability?.status && (
                                <div className="absolute bottom-2 right-2 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-green-500 rounded-full border-[3px] border-[#050505] flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full opacity-80" />
                                    </div>
                                    <div className="absolute left-full ml-3 bg-zinc-900/90 text-[10px] font-bold uppercase tracking-widest text-green-400 px-2 py-1 rounded border border-zinc-800 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none lg:pointer-events-auto">
                                        Available
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Identity */}
                        <div className="space-y-4">
                            <h1 className="text-6xl lg:text-8xl font-display font-black text-white tracking-tighter leading-[0.85] uppercase">
                                {safeData.name}
                            </h1>
                            <p className="text-xl font-medium text-zinc-500">{safeData.role}</p>
                            
                            {/* Meta Row */}
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

                        {/* Bio */}
                        <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-light max-w-sm">
                            {safeData.bio}
                        </p>

                        {/* Socials Dock */}
                        <div className="flex flex-wrap gap-3">
                            {safeData.socials && Object.entries(safeData.socials).map(([key, val]) => {
                                if (!val) return null;
                                const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail, discord: Globe }[key.toLowerCase()] || Globe;
                                const url = ensureUrl(val as string, key);
                                return (
                                    <a 
                                        key={key} 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-3.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-white hover:border-white transition-all duration-300 group"
                                    >
                                        <Icon size={20} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                )
                            })}
                        </div>
                    </div>

                    {/* Footer / CTA */}
                    <div className="hidden lg:block space-y-4">
                         <div className="w-full h-px bg-zinc-900" />
                         <div className="flex justify-between items-end">
                            <a href={`mailto:${safeData.contactEmail}`} className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                                <span className="text-sm font-medium">Get in touch</span>
                                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
                            </a>
                            <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">© {new Date().getFullYear()}</span>
                         </div>
                    </div>
                </aside>

                {/* --- CONTENT AREA --- */}
                <main className="flex-1 min-w-0 bg-[#050505] relative z-0">
                    
                    {/* 1. Showreel Section */}
                    {safeData.showreelLink && (
                        <section className="p-6 md:p-12 xl:p-16 border-b border-zinc-900/50">
                            <div className="flex items-center gap-3 mb-8">
                                <h2 className="text-3xl font-display font-bold text-white tracking-tight">Showreels</h2>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">Latest</span>
                            </div>
                            
                            <div className="w-full aspect-video md:aspect-[21/9] lg:aspect-[16/8] rounded-2xl overflow-hidden ring-1 ring-zinc-800 shadow-2xl relative group">
                                <VideoPlayer 
                                    src={safeData.showreelLink} 
                                    thumbnail={safeData.showreelThumbnail} 
                                    autoplay={introComplete}
                                    muted={isShowreelMuted}
                                    onToggleMute={() => setIsShowreelMuted(!isShowreelMuted)}
                                    className="scale-[1.01] group-hover:scale-100 transition-transform duration-1000"
                                />
                            </div>
                        </section>
                    )}

                    {/* 2. Work Grid (Masonry Layout) */}
                    <div className="p-5 md:p-10 xl:p-14">
                        {safeData.projects && safeData.projects.length > 0 && (
                            <section className="mb-16">
                                <div className="flex items-end justify-between mb-8">
                                    <h2 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">MY WORK</h2>
                                    <div className="h-px flex-1 bg-zinc-900 ml-8 relative top-[-10px] hidden md:block" />
                                </div>

                                {/* Desktop: Dynamic Balanced Columns with Compact Spacing */}
                                <div className="hidden md:flex gap-3 items-start">
                                    {projectColumns.map((col, idx) => (
                                        <div key={idx} className={`space-y-3 ${numColumns === 3 ? 'w-1/3' : 'w-1/2'}`}>
                                            {col.map(project => (
                                                <ProjectCard 
                                                    key={project.id} 
                                                    project={project} 
                                                    onClick={() => setSelectedProject(project)} 
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile: Single Stack with Compact Spacing */}
                                <div className="md:hidden space-y-3">
                                    {safeData.projects.map(project => (
                                        <ProjectCard 
                                            key={project.id} 
                                            project={project} 
                                            onClick={() => setSelectedProject(project)} 
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. Dedicated Skills Section */}
                        <section className="space-y-12 border-t border-zinc-900 pt-16">
                             <div className="flex items-end gap-6 mb-8">
                                <h2 className="text-4xl font-display font-black text-white tracking-tight uppercase">Skills & Tools</h2>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                                 
                                 {/* Primary Workflow (Large Card) */}
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
                                     {/* Standard Stack */}
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

                                     {/* AI Tools */}
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
                        
                        {/* Mobile Only Footer */}
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