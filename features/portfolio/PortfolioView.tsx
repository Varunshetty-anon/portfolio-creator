import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { Mail, Instagram, Twitter, Linkedin, Youtube, Globe, X, Volume2, VolumeX, Loader2, MapPin, MonitorPlay, ArrowDown, Sparkles, Play } from 'lucide-react';
import { PortfolioData, Project } from '../../types';
import { getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDriveId, getDropboxDirectLink } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Helpers ---
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

    if (!tool || hasError) {
        return <span className={`flex items-center justify-center font-bold text-zinc-500 text-[10px] uppercase border border-zinc-700 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    }
    return <img src={imgSrc} alt={name} loading="lazy" className={`${className} object-contain opacity-80`} onError={() => setHasError(true)} />;
});

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

// --- Improved Showreel Player ---
const ShowreelPlayer: React.FC<{ src: string; thumbnail: string }> = React.memo(({ src, thumbnail }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isInView = useInView(containerRef, { margin: "0px", amount: 0.4 }); 

    const type = React.useMemo(() => {
        if (!src) return 'none';
        const lower = src.toLowerCase();
        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
        if (lower.includes('vimeo.com')) return 'vimeo';
        if (lower.includes('drive.google.com')) return 'drive';
        if (lower.includes('dropbox.com') || lower.includes('dl.dropboxusercontent.com')) return 'dropbox';
        return 'direct'; 
    }, [src]);

    const directSrc = type === 'dropbox' ? getDropboxDirectLink(src) || src : src;

    // Intersection-based Autoplay Logic
    useEffect(() => {
        if (type !== 'direct' && type !== 'dropbox') return;
        
        const video = videoRef.current;
        if (!video) return;

        if (isInView) {
            video.muted = true; // Always mute for autoplay
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(() => {
                    // Autoplay prevented (e.g. low power mode), show fallback UI
                    setIsPlaying(false);
                });
            }
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, [isInView, type]);

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    const handleVideoReady = () => {
        setIsReady(true);
    };

    // Iframes
    const getEmbedSrc = () => {
         if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            // Uses JS API to enable more reliable control if needed, but basic autoplay params here
            return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&showinfo=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;
        }
        if (type === 'vimeo') {
             const vId = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)?.[1];
             return `https://player.vimeo.com/video/${vId}?autoplay=1&muted=1&loop=1&background=1`;
        }
        if (type === 'drive') {
            const id = getDriveId(src);
            return `https://drive.google.com/file/d/${id}/preview?autoplay=1&muted=1`;
        }
        return src;
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl group max-w-4xl mx-auto"
            style={{ minHeight: '300px' }} // Prevent layout collapse before load
        >
             {/* Thumbnail / Loading Layer */}
             <div 
                className={`absolute inset-0 z-20 bg-black transition-opacity duration-1000 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
             >
                {thumbnail && <img src={thumbnail} className="w-full h-full object-cover opacity-60" alt="Showreel" />}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                             <motion.div 
                                className="h-full bg-indigo-500" 
                                initial={{ width: "0%" }} 
                                animate={{ width: "100%" }} 
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} 
                             />
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Content */}
            {type === 'direct' || type === 'dropbox' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video 
                        ref={videoRef}
                        src={directSrc}
                        className="w-full h-full max-h-[80vh] object-contain"
                        loop 
                        muted={true}
                        playsInline
                        preload="metadata"
                        onCanPlay={handleVideoReady}
                        onLoadedData={handleVideoReady}
                    />
                    
                    {/* Controls Overlay */}
                    <div className="absolute bottom-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={toggleMute} 
                            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                        >
                            {isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                        </button>
                    </div>
                    
                    {/* Fallback Play Button if Autoplay fails or pauses */}
                    {!isPlaying && isReady && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors cursor-pointer" onClick={() => videoRef.current?.play()}>
                             <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform">
                                 <Play size={24} fill="currentColor" />
                             </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative w-full aspect-video">
                     <iframe 
                        src={isInView ? getEmbedSrc() : ''} 
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture" 
                        onLoad={() => setTimeout(() => setIsReady(true), 800)}
                    />
                    {/* Transparent overlay to prevent capturing scroll on iframes unless clicked */}
                    <div className="absolute inset-0 z-10 pointer-events-none" /> 
                </div>
            )}
        </div>
    );
});

const CollageProjectCard: React.FC<{ project: Project; onClick: () => void }> = React.memo(({ project, onClick }) => {
    const isPortrait = project.aspectRatio === '9:16';
    // Use standard responsive grid classes, but add row spans for masonry feel if grid-auto-flow is dense
    const spanClass = isPortrait ? "md:row-span-2" : "md:row-span-1";
    
    return (
        <motion.div 
            className={`relative group cursor-pointer bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 ${spanClass} h-64 md:h-auto min-h-[250px]`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.5 }}
            onClick={onClick}
        >
            <div className="absolute inset-0 z-0">
                <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10" />
            
            <div className="absolute bottom-0 left-0 w-full p-5 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                 {(project.contentType || project.category) && <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2 block opacity-0 group-hover:opacity-100 transition-opacity delay-75">{project.contentType || project.category}</span>}
                 <h3 className="text-base font-bold text-white leading-tight line-clamp-2">{project.title}</h3>
            </div>
        </motion.div>
    )
});

const Lightbox: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    const driveEmbed = getDriveEmbedUrl(project.link);
    const dropboxDirect = getDropboxDirectLink(project.link);

    return (
        <motion.div 
            className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose}
        >
            <button className="absolute top-4 right-4 p-3 bg-zinc-800/50 rounded-full text-white hover:bg-white hover:text-black transition-all z-[2100]">
                <X size={20} />
            </button>

            <motion.div 
                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-w-6xl w-full h-[85vh]" 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-1 bg-black flex items-center justify-center p-2 relative">
                    <div className="w-full h-full flex items-center justify-center">
                        {project.type === 'video' ? (
                            <>
                                {dropboxDirect ? (
                                    <video src={dropboxDirect} controls autoPlay className="w-full h-full object-contain" />
                                ) : driveEmbed ? (
                                    <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                                ) : project.link.includes('youtube') || project.link.includes('vimeo') ? (
                                    <iframe src={project.link} className="w-full h-full" allow="autoplay; fullscreen" />
                                ) : (
                                    <video src={project.link} controls autoPlay className="w-full h-full object-contain" />
                                )}
                            </>
                        ) : (
                            <img src={project.link || project.thumbnail} className="w-full h-full object-contain" />
                        )}
                    </div>
                </div>

                <div className="w-full md:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="mb-6">
                            {project.contentType && <span className="text-[10px] font-bold uppercase text-indigo-400 mb-2 block">{project.contentType}</span>}
                            <h2 className="text-xl font-display font-bold text-white mb-4 leading-tight">{project.title}</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">{project.description}</p>
                        </div>
                        {project.softwareUsed && project.softwareUsed.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Tools</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.softwareUsed.map(t => <span key={t} className="px-2 py-1 bg-black border border-zinc-800 rounded text-[10px] text-zinc-300">{t}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                        <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase hover:bg-zinc-200 transition-colors">
                            Open Original <MonitorPlay size={14} />
                        </a>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const { scrollY } = useScroll();
    const [isMobile, setIsMobile] = useState(false);

    // Responsive check for animation logic
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // TRANSITION LOGIC
    // We create a "Spacer" div at the top. The profile is fixed.
    // As we scroll through the spacer, the profile transforms.
    // Content starts after spacer.
    const SPACER_HEIGHT = 600; // Amount of scroll to complete transformation
    
    // -- SHARED/DESKTOP TRANSFORMS --
    // Desktop: Center -> Left Sidebar
    const width = useTransform(scrollY, [0, SPACER_HEIGHT], ["100%", "28%"]);
    const desktopPaddingLeft = useTransform(scrollY, [0, SPACER_HEIGHT], ["0rem", "3rem"]);
    const alignItems = useTransform(scrollY, [0, SPACER_HEIGHT], ["center", "flex-start"]);
    const textAlign = useTransform(scrollY, [0, SPACER_HEIGHT], ["center", "left"]);
    
    const avatarSizeDesktop = useTransform(scrollY, [0, SPACER_HEIGHT], [180, 72]);
    const nameSizeDesktop = useTransform(scrollY, [0, SPACER_HEIGHT], ["4.5rem", "2rem"]);
    const bioOpacityDesktop = useTransform(scrollY, [0, SPACER_HEIGHT/2], [1, 1]); // Bio stays on desktop
    
    // -- MOBILE TRANSFORMS --
    // Mobile: Center -> Top Header
    const mobileHeight = useTransform(scrollY, [0, 300], ["100vh", "80px"]);
    const mobileBg = useTransform(scrollY, [200, 300], ["rgba(5,5,5,0)", "rgba(5,5,5,0.95)"]);
    const mobileBackdrop = useTransform(scrollY, [200, 300], ["blur(0px)", "blur(12px)"]);
    
    const avatarSizeMobile = useTransform(scrollY, [0, 300], [140, 36]);
    const nameScaleMobile = useTransform(scrollY, [0, 300], [1, 0.7]);
    const detailsOpacityMobile = useTransform(scrollY, [0, 150], [1, 0]); // Fade out quickly on scroll
    
    // -- CONTENT REVEAL --
    // Content (showreel, etc) is hidden initially. It fades in as the profile finishes moving.
    const contentOpacity = useTransform(scrollY, [SPACER_HEIGHT * 0.7, SPACER_HEIGHT], [0, 1]);
    const contentY = useTransform(scrollY, [SPACER_HEIGHT * 0.7, SPACER_HEIGHT], [50, 0]);

    // Active Transforms based on device
    // Note: We use conditional rendering for the Profile block structure to keep DOM clean, 
    // but hooks are called unconditionally above.
    
    useEffect(() => {
        if (!isPreview && data.uid) trackPortfolioView(data.uid);
        document.body.style.overflow = selectedProject ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = ''; }
    }, [data.uid, isPreview, selectedProject]);

    if (!data) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    const allTools = [...(data.tools || [])];
    if (data.primaryTool && !allTools.includes(data.primaryTool)) allTools.unshift(data.primaryTool);
    const secondaryTools = allTools.filter(t => t !== data.primaryTool);

    return (
        <div className="bg-[#050505] min-h-screen w-full relative text-white font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
             <AnimatePresence>
                {selectedProject && <Lightbox project={selectedProject} onClose={() => setSelectedProject(null)} />}
             </AnimatePresence>

             {/* --- SPACER FOR SCROLL LOGIC --- */}
             {/* This invisible div creates the scrollable area that drives the animation before content appears */}
             <div style={{ height: isMobile ? 400 : SPACER_HEIGHT + 100 }} className="w-full pointer-events-none" />

             {/* --- FIXED PROFILE SECTION --- */}
             {/* Uses Fixed positioning to stay in view while transforming */}
             <motion.div 
                className="fixed top-0 left-0 z-40 flex flex-col pointer-events-none"
                style={!isMobile ? {
                    width: width,
                    height: '100vh',
                    paddingLeft: desktopPaddingLeft,
                    alignItems: alignItems,
                    justifyContent: 'center', // Always centered vertically on desktop sidebar
                } : {
                    width: '100%',
                    height: mobileHeight,
                    backgroundColor: mobileBg,
                    backdropFilter: mobileBackdrop,
                    borderBottom: useTransform(scrollY, [299, 300], ["1px solid transparent", "1px solid #27272a"]),
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
             >
                 {/* Inner Container for Interaction */}
                 <div className={`pointer-events-auto flex flex-col transition-all duration-300 w-full px-6 ${!isMobile ? 'max-w-xl' : 'items-center'}`}>
                     
                     {/* AVATAR */}
                     <motion.div 
                        style={{ 
                            width: isMobile ? avatarSizeMobile : avatarSizeDesktop, 
                            height: isMobile ? avatarSizeMobile : avatarSizeDesktop 
                        }} 
                        className="rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 mb-6 shrink-0 shadow-2xl relative"
                        layout
                     >
                        <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                     </motion.div>
                     
                     {/* TEXT INFO */}
                     <motion.div 
                        style={{ 
                            textAlign: isMobile ? 'center' : textAlign, 
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMobile ? 'center' : alignItems
                        }}
                     >
                         <motion.h1 
                            style={{ 
                                fontSize: isMobile ? '1.5rem' : nameSizeDesktop,
                                scale: isMobile ? nameScaleMobile : 1
                            }} 
                            className="font-display font-black tracking-tighter uppercase leading-[0.9] mb-3 origin-center"
                         >
                            {data.name}
                         </motion.h1>
                         
                         {/* Details Wrapper - Fades out on Mobile Scroll */}
                         <motion.div 
                            style={{ 
                                opacity: isMobile ? detailsOpacityMobile : bioOpacityDesktop,
                                display: isMobile ? useTransform(scrollY, [0, 150], ["block", "none"]) : "block"
                            }}
                            className="w-full"
                         >
                            <p className="text-xl text-zinc-400 font-medium tracking-tight mb-4">{data.role}</p>
                            
                            <div className="space-y-4">
                                {data.location && (
                                    <div className={`flex items-center gap-2 text-sm text-zinc-500 ${!isMobile && textAlign.get() === 'left' ? 'justify-start' : 'justify-center'}`}>
                                        <MapPin size={14} /> {data.location}
                                    </div>
                                )}
                                <p className="text-zinc-500 text-sm leading-relaxed font-light max-w-sm mx-auto lg:mx-0">{data.bio}</p>
                                
                                <div className={`flex flex-wrap gap-4 mt-6 ${!isMobile && textAlign.get() === 'left' ? 'justify-start' : 'justify-center'}`}>
                                    <a href={`mailto:${data.contactEmail}`} className="px-6 py-2.5 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                                        Contact
                                    </a>
                                    <div className="flex items-center gap-2">
                                        {Object.entries(data.socials).map(([key, val]) => {
                                            if (!val) return null;
                                            const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                            return (
                                                <a key={key} href={getSocialUrl(key, val as string)} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors">
                                                    <Icon size={14} />
                                                </a>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                         </motion.div>
                     </motion.div>
                 </div>
                 
                 {/* Mobile Scroll Hint */}
                 {isMobile && (
                     <motion.div style={{ opacity: detailsOpacityMobile }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-600 animate-bounce">
                        <ArrowDown size={20} />
                     </motion.div>
                 )}
             </motion.div>


             {/* --- SCROLLABLE CONTENT --- */}
             <motion.div 
                className="relative z-0 container mx-auto px-4 md:px-8 pb-32 lg:ml-[28%] lg:w-[72%] lg:pl-16 min-h-screen"
                style={{ 
                    opacity: contentOpacity, 
                    y: contentY,
                    marginTop: '2rem' // Gap after spacer
                }}
             >
                 {/* 1. Showreel */}
                 {data.showreelLink && (
                     <section className="mb-32 scroll-mt-32 max-w-5xl" id="showreel">
                         <div className="flex items-center gap-3 mb-6">
                             <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                             <span className="text-zinc-500 font-display font-bold text-[10px] tracking-[0.2em] uppercase">Showreel</span>
                         </div>
                         <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                     </section>
                 )}

                 {/* 2. My Works (Collage Grid) */}
                 {data.projects && data.projects.length > 0 && (
                     <section className="mb-32 scroll-mt-32" id="projects">
                         <div className="flex items-end justify-between border-b border-zinc-900 pb-6 mb-12">
                            <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter">Selected Works</h3>
                            <span className="text-zinc-600 text-[10px] font-bold tracking-widest hidden md:block">{data.projects.length} PROJECTS</span>
                         </div>
                         
                         {/* Masonry-ish Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-auto grid-flow-dense">
                             {data.projects.map((project) => (
                                 <CollageProjectCard 
                                    key={project.id} 
                                    project={project} 
                                    onClick={() => setSelectedProject(project)} 
                                 />
                             ))}
                         </div>
                     </section>
                 )}

                 {/* 3. Arsenal / Skills */}
                 {(data.tools?.length > 0 || data.primaryTool) && (
                     <section className="mb-32 scroll-mt-32" id="skills">
                         <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter mb-8">Creative Arsenal</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {/* Primary tool */}
                             {data.primaryTool && (
                                 <div className="col-span-2 md:col-span-2 aspect-[2/1] bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-6 group relative overflow-hidden">
                                     <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                     <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 shadow-xl relative z-10">
                                         <ToolIcon name={data.primaryTool} className="w-8 h-8" />
                                     </div>
                                     <div className="relative z-10">
                                         <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider mb-1 block">Primary Tool</span>
                                         <span className="text-lg font-bold text-white">{data.primaryTool}</span>
                                     </div>
                                 </div>
                             )}
                             
                             {secondaryTools.map(tool => (
                                 <div key={tool} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-3 aspect-square hover:bg-zinc-800/50 transition-colors group">
                                     <ToolIcon name={tool} className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                                     <span className="text-[10px] font-medium text-zinc-400 group-hover:text-white transition-colors text-center">{tool}</span>
                                 </div>
                             ))}
                             
                             {data.aiTools?.map(tool => (
                                  <div key={tool} className="bg-zinc-900/30 border border-indigo-500/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3 aspect-square relative overflow-hidden group">
                                     <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity"><Sparkles size={10} className="text-indigo-500"/></div>
                                     <ToolIcon name={tool} className="w-8 h-8 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                     <span className="text-[10px] font-medium text-indigo-200/40 group-hover:text-indigo-200 transition-colors text-center">{tool}</span>
                                 </div>
                             ))}
                         </div>
                     </section>
                 )}

                 <footer className="pt-20 border-t border-zinc-900 text-center lg:text-left">
                     <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-8">Ready to create?</h2>
                     <a href={`mailto:${data.contactEmail}`} className="inline-block text-xl text-zinc-400 hover:text-white transition-colors border-b border-zinc-800 hover:border-white pb-1 mb-12">
                         {data.contactEmail}
                     </a>
                     <div className="flex justify-between items-center text-zinc-800 text-[10px] uppercase tracking-widest">
                         <p>© {new Date().getFullYear()} {data.name}</p>
                         <p>Frames Studio</p>
                     </div>
                 </footer>
             </motion.div>
        </div>
    );
};