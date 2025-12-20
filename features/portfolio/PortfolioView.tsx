import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, Variants } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Globe, Maximize2, Star, Sparkles, MonitorPlay, MapPin, Loader2, Database, ArrowDown } from 'lucide-react';
import { PortfolioData, Project } from '../../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, trackPortfolioClick, getDriveId, getDropboxDirectLink } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Icons & Helpers ---

const ToolIcon = React.memo(({ name, className = "w-6 h-6" }: { name: string; className?: string }) => {
    const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
    const [imgSrc, setImgSrc] = useState(tool ? `https://cdn.simpleicons.org/${tool.slug}/white` : '');
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (tool) {
            setImgSrc(`https://cdn.simpleicons.org/${tool.slug}/white`);
            setHasError(false);
        }
    }, [name, tool]);

    const handleError = () => {
        if (!tool) { setHasError(true); return; }
        setHasError(true);
    };

    if (!tool || hasError) {
        return <span className={`flex items-center justify-center font-bold text-zinc-500 text-[10px] uppercase border border-zinc-700 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    }

    return (
        <img src={imgSrc} alt={name} loading="lazy" className={`${className} object-contain opacity-80`} onError={handleError} />
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

// --- Components ---

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
    const isInView = useInView(containerRef, { amount: 0.2 });

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
        if ((type === 'direct' || type === 'dropbox') && videoRef.current) {
            videoRef.current.muted = true; // Always start muted
            if (isInView) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isInView, type, directSrc]);

    const getEmbedSrc = () => {
        if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&showinfo=0&modestbranding=1&enablejsapi=1`;
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
            {/* Ambient Glow */}
            <div className="absolute -inset-1 sm:-inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0">
                <img src={thumbnail} className="w-full h-full object-cover blur-3xl scale-105 opacity-60 rounded-[3rem]" aria-hidden="true" />
            </div>

            <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl z-10">
                {/* Loading State */}
                <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 ease-in-out ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}>
                    <img src={thumbnail || "https://picsum.photos/800/450"} className="w-full h-full object-cover" alt="Loading" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="w-10 h-10 text-white/70 animate-spin" />
                    </div>
                </div>

                {type === 'direct' || type === 'dropbox' ? (
                    <video 
                        ref={videoRef}
                        key={directSrc}
                        src={directSrc}
                        className="w-full h-full object-cover"
                        loop
                        muted={isMuted}
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
                        className="w-full h-full pointer-events-none"
                        allow="autoplay; fullscreen; picture-in-picture"
                        title="Showreel"
                        onLoad={() => setTimeout(() => setIsVideoReady(true), 1500)}
                    />
                )}

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
    
    // Dynamic aspect ratio calculation
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
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800">
                    <div className="w-full h-full flex items-center justify-center p-0 md:p-4">
                         {project.type === 'video' ? (
                            <div 
                                className="relative w-full max-h-full mx-auto bg-black"
                                style={{ 
                                    ...getAspectRatioStyle(),
                                    maxWidth: project.aspectRatio === '9:16' ? '50vh' : '100%', 
                                }}
                            >
                                {dropboxDirect ? (
                                    <video src={dropboxDirect} controls autoPlay className="w-full h-full object-contain" playsInline crossOrigin="anonymous"/>
                                ) : driveEmbed ? (
                                    <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                                ) : project.link.includes('youtube') || project.link.includes('vimeo') ? (
                                    <iframe src={project.link} className="w-full h-full" allow="autoplay; fullscreen" />
                                ) : (
                                    <video src={project.link} controls autoPlay className="w-full h-full object-contain" playsInline crossOrigin="anonymous"/>
                                )}
                            </div>
                         ) : (
                            <img src={project.link || project.thumbnail} className="w-full h-full object-contain" alt={project.title} />
                         )}
                    </div>
                </div>

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
                            <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors">
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
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const { scrollY } = useScroll();
    
    // --- Desktop Animations ---
    const dLeft = useTransform(scrollY, [0, 500], ["50%", "16.66%"]);
    const dScale = useTransform(scrollY, [0, 500], [1, 1]); 
    const dOpacity = useTransform(scrollY, [0, 100], [1, 1]); // Always visible, but moves
    
    // --- Mobile Animations ---
    const mTop = useTransform(scrollY, [0, 300], ["40%", "0%"]);
    const mY = useTransform(scrollY, [0, 300], ["-50%", "0%"]);
    const mScale = useTransform(scrollY, [0, 300], [1, 0.8]);
    const mBg = useTransform(scrollY, [200, 300], ["rgba(5,5,5,0)", "rgba(9,9,11,0.95)"]);
    const mBackdrop = useTransform(scrollY, [200, 300], ["blur(0px)", "blur(16px)"]);
    const mBorder = useTransform(scrollY, [200, 300], ["rgba(39,39,42,0)", "rgba(39,39,42,1)"]);
    
    const mBioOpacity = useTransform(scrollY, [0, 150], [1, 0]);
    const mBioHeight = useTransform(scrollY, [0, 150], ["auto", "0px"]);
    const mAvatarSize = useTransform(scrollY, [0, 300], ["128px", "40px"]);

    // Fix scroll locking
    useEffect(() => {
        if (!isPreview && data.uid) {
            trackPortfolioView(data.uid);
        }
        // Force overflow visible on mount to ensure scrolling works
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        return () => {
             document.body.style.overflow = '';
             document.documentElement.style.overflow = '';
        }
    }, [data.uid, isPreview]);

    useEffect(() => {
        if (selectedProject) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        }
    }, [selectedProject]);

    if (!data) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    const allTools = [...(data.tools || [])];
    if (data.primaryTool && !allTools.includes(data.primaryTool)) allTools.unshift(data.primaryTool);
    const secondaryTools = allTools.filter(t => t !== data.primaryTool);

    return (
        <div className="bg-[#050505] min-h-screen w-full relative overflow-x-hidden text-white font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
             <AnimatePresence>
                {selectedProject && <Lightbox project={selectedProject} onClose={() => setSelectedProject(null)} />}
             </AnimatePresence>

             {/* --- Desktop Hero (Fixed Layer) --- */}
             <motion.div 
                className="hidden lg:flex fixed top-0 left-0 w-full h-full pointer-events-none z-20 items-center justify-start"
             >
                 <motion.div 
                    style={{ left: dLeft, x: "-50%", opacity: dOpacity, scale: dScale }}
                    className="absolute top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center text-center max-w-md p-8 w-full"
                 >
                     <div className="w-40 h-40 rounded-full overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 mb-8 relative group">
                        <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                        {data.availability.status && (
                            <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900 shadow-[0_0_10px_#22c55e]" />
                        )}
                     </div>
                     <h1 className="text-6xl font-display font-black tracking-tighter uppercase leading-[0.9] mb-4">{data.name}</h1>
                     <p className="text-xl text-zinc-400 font-medium tracking-tight mb-6">{data.role}</p>
                     <p className="text-zinc-500 text-sm leading-relaxed mb-8 font-light max-w-xs">{data.bio}</p>
                     
                     <div className="flex gap-4">
                        <a href={`mailto:${data.contactEmail}`} className="px-6 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                            Contact
                        </a>
                        <div className="flex items-center gap-2">
                            {Object.entries(data.socials).map(([key, val]) => {
                                if (!val) return null;
                                const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                return (
                                    <a key={key} href={getSocialUrl(key, val as string)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors">
                                        <Icon size={16} />
                                    </a>
                                )
                            })}
                        </div>
                     </div>
                     
                     {/* Scroll Hint */}
                     <motion.div 
                        animate={{ y: [0, 10, 0] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-32 left-1/2 -translate-x-1/2 text-zinc-700 opacity-50"
                     >
                        <ArrowDown size={24} />
                     </motion.div>
                 </motion.div>
             </motion.div>

             {/* --- Mobile Hero (Sticky Layer) --- */}
             <motion.div 
                className="lg:hidden fixed top-0 w-full z-40 overflow-hidden flex flex-col items-center shadow-2xl pointer-events-auto"
                style={{ top: mTop, y: mY, backgroundColor: mBg, backdropFilter: mBackdrop, borderBottom: '1px solid', borderBottomColor: mBorder }}
             >
                 <motion.div className="flex flex-col items-center text-center px-6 py-6 relative z-10 w-full justify-center">
                     <motion.div 
                        style={{ width: mAvatarSize, height: mAvatarSize }} 
                        className="mb-4 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 mx-auto"
                     >
                        <img src={data.profileImage} className="w-full h-full object-cover" />
                     </motion.div>
                     
                     <motion.div style={{ scale: mScale }} className="origin-center">
                         <h1 className="text-3xl font-display font-black tracking-tighter uppercase leading-none">{data.name}</h1>
                         <motion.p style={{ opacity: mBioOpacity, height: mBioHeight }} className="text-zinc-400 text-sm mt-2">{data.role}</motion.p>
                     </motion.div>

                     <motion.div style={{ opacity: mBioOpacity, height: mBioHeight }} className="mt-4 overflow-hidden">
                         <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed mb-4">{data.bio}</p>
                         <div className="flex justify-center gap-4">
                            <a href={`mailto:${data.contactEmail}`} className="px-5 py-2 bg-white/10 border border-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">Email Me</a>
                         </div>
                     </motion.div>
                 </motion.div>
             </motion.div>

             {/* --- Scrollable Content Column --- */}
             <div className="relative z-0 container mx-auto px-4 md:px-8 pb-32">
                 {/* Spacer: Height of 100vh ensures the first fold is empty except for the fixed hero */}
                 <div className="h-[100vh] w-full" /> 

                 <div className="lg:ml-[33.33%] lg:w-[66.66%] lg:pl-16">
                     
                     {/* Showreel Section (Order #2) */}
                     {data.showreelLink && (
                         <section className="mb-32 scroll-mt-32" id="showreel">
                             <div className="flex items-center gap-4 mb-8">
                                 <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                 <span className="text-zinc-500 font-display font-bold text-xs tracking-[0.2em] uppercase">Showreel</span>
                             </div>
                             <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                         </section>
                     )}

                     {/* Projects Grid (Order #3) */}
                     {data.projects && data.projects.length > 0 && (
                         <section className="mb-32 scroll-mt-32" id="projects">
                             <div className="flex items-end justify-between border-b border-zinc-900 pb-6 mb-12">
                                <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter">Selected Works</h3>
                                <span className="text-zinc-600 text-xs font-bold tracking-widest hidden md:block">{data.projects.length} PROJECTS</span>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[300px]">
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
                     
                     {/* Tools & Skills (Order #4) */}
                     {(data.tools?.length > 0 || data.primaryTool) && (
                         <section className="mb-32 scroll-mt-32" id="skills">
                             <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter mb-12">Arsenal</h3>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                 {data.primaryTool && <PrimaryToolCard toolName={data.primaryTool} />}
                                 {secondaryTools.map(tool => (
                                     <div key={tool} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 aspect-square">
                                         <ToolIcon name={tool} className="w-8 h-8 opacity-60" />
                                         <span className="text-xs font-bold text-zinc-400">{tool}</span>
                                     </div>
                                 ))}
                                 {data.aiTools?.map(tool => (
                                      <div key={tool} className="bg-zinc-900/50 border border-indigo-500/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 aspect-square relative overflow-hidden">
                                         <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={12} className="text-indigo-500"/></div>
                                         <ToolIcon name={tool} className="w-8 h-8 opacity-60" />
                                         <span className="text-xs font-bold text-indigo-200/70">{tool}</span>
                                     </div>
                                 ))}
                             </div>
                         </section>
                     )}

                     {/* Footer (Order #5) */}
                     <footer className="pt-20 border-t border-zinc-900 text-center lg:text-left">
                         <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-8">Ready to collaborate?</h2>
                         <a href={`mailto:${data.contactEmail}`} className="inline-block text-xl text-zinc-400 hover:text-white transition-colors border-b border-zinc-800 hover:border-white pb-1 mb-12">
                             {data.contactEmail}
                         </a>
                         <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
                             © {new Date().getFullYear()} {data.name}. All rights reserved.
                         </p>
                     </footer>
                 </div>
             </div>
        </div>
    );
};