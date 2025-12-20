
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { Mail, Instagram, Twitter, Linkedin, Youtube, Globe, X, Volume2, VolumeX, Loader2, Play, ExternalLink, ArrowDown, Sparkles, CheckCircle2 } from 'lucide-react';
import { PortfolioData, Project } from '../../types';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDriveId, getDropboxDirectLink } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

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
        return <span className={`flex items-center justify-center font-bold text-zinc-600 text-[10px] uppercase border border-zinc-800 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    }
    return <img src={imgSrc} alt={name} loading="lazy" className={`${className} object-contain opacity-70 group-hover:opacity-100 transition-opacity`} onError={() => setHasError(true)} />;
});

const VideoPlayer: React.FC<{ src: string; thumbnail: string; autoplay?: boolean; isModal?: boolean; aspectRatio?: string }> = ({ src, thumbnail, autoplay = false, isModal = false, aspectRatio = '16/9' }) => {
    const [isReady, setIsReady] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [hasInteraction, setHasInteraction] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isInView = useInView(containerRef, { margin: "0px", amount: 0.2 });

    const type = useMemo(() => {
        if (!src) return 'none';
        const lower = src.toLowerCase();
        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
        if (lower.includes('vimeo.com')) return 'vimeo';
        if (lower.includes('drive.google.com')) return 'drive';
        if (lower.includes('dropbox.com')) return 'dropbox';
        return 'direct';
    }, [src]);

    const directSrc = type === 'dropbox' ? getDropboxDirectLink(src) || src : src;

    // Handle Autoplay for Direct/Dropbox
    useEffect(() => {
        if ((type !== 'direct' && type !== 'dropbox') || !videoRef.current) return;
        
        if (autoplay && isInView) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setIsMuted(true);
                });
            }
        } else if (!isModal) {
            videoRef.current.pause();
        }
    }, [isInView, type, autoplay, isModal]);

    const getEmbedSrc = () => {
        const base = src.toLowerCase();
        if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            return `https://www.youtube.com/embed/${ytId}?autoplay=${autoplay && isInView ? 1 : 0}&mute=1&controls=${isModal ? 1 : 0}&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3`;
        }
        if (type === 'vimeo') {
            const vId = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)?.[1];
            return `https://player.vimeo.com/video/${vId}?autoplay=${autoplay && isInView ? 1 : 0}&muted=1&loop=1&background=${isModal ? 0 : 1}&playsinline=1`;
        }
        if (type === 'drive') {
            const id = getDriveId(src);
            return `https://drive.google.com/file/d/${id}/preview`;
        }
        return src;
    };

    const ratioStyle = useMemo(() => {
        if (!aspectRatio) return { aspectRatio: '16/9' };
        return { aspectRatio: aspectRatio.replace(':', '/') };
    }, [aspectRatio]);

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full bg-black overflow-hidden group ${!isModal ? 'rounded-2xl md:rounded-3xl' : ''}`}
            style={isModal ? { height: '100%', width: '100%' } : ratioStyle}
        >
            <AnimatePresence>
                {!isReady && (
                    <motion.div 
                        initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-zinc-950 flex items-center justify-center"
                    >
                        {thumbnail && <img src={thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm" />}
                        <Loader2 className="animate-spin text-zinc-500 relative z-30" />
                    </motion.div>
                )}
            </AnimatePresence>

            {!hasInteraction && !isReady && (
                <div 
                    className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
                    onClick={() => setHasInteraction(true)}
                />
            )}

            {(type === 'direct' || type === 'dropbox') ? (
                <div className="w-full h-full relative">
                    <video 
                        ref={videoRef} src={directSrc} 
                        className="w-full h-full"
                        style={{ objectFit: isModal ? 'contain' : 'cover' }}
                        loop muted={isMuted} playsInline preload="metadata"
                        onLoadedData={() => setIsReady(true)}
                        onClick={() => {
                            if (videoRef.current) {
                                if (videoRef.current.paused) videoRef.current.play();
                                else videoRef.current.pause();
                            }
                        }}
                    />
                     {isModal && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                            className="absolute bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
                        >
                            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                        </button>
                    )}
                </div>
            ) : (
                <iframe 
                    src={getEmbedSrc()} 
                    className="w-full h-full border-none" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    onLoad={() => setIsReady(true)} 
                />
            )}
        </div>
    );
};

const ProjectLightbox: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    const ar = project.aspectRatio || '16:9';

    return (
        <motion.div 
            className="fixed inset-0 z-[2000] bg-black/98 backdrop-blur-xl flex items-center justify-center p-0 md:p-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <button className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-zinc-500 hover:text-white transition-all z-[2100] bg-zinc-900/80 rounded-full border border-zinc-800 backdrop-blur-md"><X size={24} /></button>
            
            <motion.div 
                className="relative bg-[#050505] w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:aspect-video max-w-[1600px] flex flex-col lg:flex-row overflow-hidden md:rounded-[2.5rem] border-0 md:border border-zinc-900 shadow-2xl"
                initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden h-[40vh] lg:h-auto w-full">
                    <div className={`w-full h-full flex items-center justify-center bg-zinc-950`}>
                         <VideoPlayer src={project.link} thumbnail={project.thumbnail} autoplay={true} isModal={true} aspectRatio={ar} />
                    </div>
                </div>

                <div className="w-full lg:w-[450px] bg-[#09090b] flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-900 h-[60vh] lg:h-auto">
                    <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar h-full">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 block">{project.contentType || 'Project'}</span>
                        <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-8 tracking-tighter leading-[0.9]">{project.title}</h2>
                        <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-10 font-light">{project.description}</p>
                        
                        <div className="space-y-8">
                            {project.softwareUsed && project.softwareUsed.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Production Tools</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {project.softwareUsed.map(t => (
                                            <span key={t} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 font-bold tracking-tight">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                             <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Format</h4>
                                <div className="flex items-center gap-4">
                                     <span className="text-xs font-mono text-zinc-400 border border-zinc-800 px-3 py-1 rounded bg-zinc-950">{project.aspectRatio || '16:9'}</span>
                                </div>
                            </div>
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
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const SCROLL_THRESHOLD = isMobile ? 300 : 500;

    // Header/Sidebar Transforms
    const headerBg = useTransform(scrollY, [SCROLL_THRESHOLD - 100, SCROLL_THRESHOLD], ["rgba(5,5,5,0)", "rgba(5,5,5,0.95)"]);
    const headerBlur = useTransform(scrollY, [SCROLL_THRESHOLD - 100, SCROLL_THRESHOLD], ["blur(0px)", "blur(16px)"]);
    const headerBorder = useTransform(scrollY, [SCROLL_THRESHOLD - 50, SCROLL_THRESHOLD], ["1px solid transparent", "1px solid #1a1a1e"]);

    const dWidth = useTransform(scrollY, [0, SCROLL_THRESHOLD], ["100%", "30%"]);
    const dAvatarSize = useTransform(scrollY, [0, SCROLL_THRESHOLD], [240, 80]);
    const dNameSize = useTransform(scrollY, [0, SCROLL_THRESHOLD], ["6rem", "2rem"]);
    
    const mHeight = useTransform(scrollY, [0, SCROLL_THRESHOLD], ["100dvh", "80px"]);
    const mAvatarSize = useTransform(scrollY, [0, SCROLL_THRESHOLD], [140, 40]);
    const mNameSize = useTransform(scrollY, [0, SCROLL_THRESHOLD], ["2.5rem", "1.1rem"]);
    
    // Details Opacity: Explicitly visible at start
    const detailsOpacity = useTransform(scrollY, [0, SCROLL_THRESHOLD * 0.5], [1, 0]);

    // Main Content Transforms: 
    // REMOVED Opacity transition from 0 to 1 on load. Now it starts at 1 but pushed down.
    // This fixes "Blank Page" issues if scroll logic fails.
    const mainY = useTransform(scrollY, [SCROLL_THRESHOLD * 0.8, SCROLL_THRESHOLD + 100], [50, 0]);
    const mainOpacity = useTransform(scrollY, [SCROLL_THRESHOLD * 0.5, SCROLL_THRESHOLD], [0.5, 1]);

    useEffect(() => {
        if (!isPreview && data.uid) trackPortfolioView(data.uid);
        document.body.style.overflow = selectedProject ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; }
    }, [data.uid, isPreview, selectedProject]);

    if (!mounted) return <div className="min-h-screen bg-[#050505]" />;

    const displayName = data.name || "VARUN SHETTY";

    return (
        <div className="bg-[#050505] min-h-[200vh] w-full relative text-zinc-100 font-sans selection:bg-indigo-500/40 overflow-x-hidden">
            <AnimatePresence>
                {selectedProject && <ProjectLightbox project={selectedProject} onClose={() => setSelectedProject(null)} />}
            </AnimatePresence>

            {/* FIXED HEADER / INTRO SECTION */}
            <motion.div 
                className="fixed top-0 left-0 z-[50] flex flex-col overflow-hidden"
                style={{
                    width: isMobile ? '100%' : dWidth,
                    height: isMobile ? mHeight : '100dvh',
                    backgroundColor: headerBg,
                    backdropFilter: headerBlur,
                    borderBottom: isMobile ? headerBorder : 'none',
                    borderRight: !isMobile ? headerBorder : 'none',
                    padding: isMobile ? (scrollY.get() > SCROLL_THRESHOLD ? '1rem' : '2rem') : (scrollY.get() > SCROLL_THRESHOLD ? '3rem' : '0rem'),
                    // Dynamic alignment logic
                    alignItems: isMobile ? 'center' : (scrollY.get() > SCROLL_THRESHOLD ? 'flex-start' : 'center'),
                    justifyContent: isMobile ? (scrollY.get() > SCROLL_THRESHOLD ? 'flex-start' : 'center') : 'center',
                    flexDirection: isMobile && scrollY.get() > SCROLL_THRESHOLD ? 'row' : 'col'
                }}
            >
                <motion.div 
                    className={`flex ${isMobile && scrollY.get() > SCROLL_THRESHOLD ? 'flex-row items-center gap-4 w-full' : 'flex-col items-center md:items-start gap-6 md:gap-10'} max-w-2xl transition-all`}
                >
                    <motion.div 
                        style={{ width: isMobile ? mAvatarSize : dAvatarSize, height: isMobile ? mAvatarSize : dAvatarSize }} 
                        className="rounded-full overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0 shadow-2xl relative"
                    >
                        <img src={data.profileImage} className="w-full h-full object-cover" alt={displayName} />
                    </motion.div>

                    <div className={`flex flex-col ${isMobile && scrollY.get() > SCROLL_THRESHOLD ? 'items-start' : 'items-center md:items-start'}`}>
                        <motion.h1 
                            style={{ fontSize: isMobile ? mNameSize : dNameSize }} 
                            className="font-display font-black tracking-tighter uppercase leading-[0.85] text-white whitespace-nowrap"
                        >
                            {displayName}
                        </motion.h1>

                        <motion.div 
                            style={{ 
                                opacity: isMobile ? detailsOpacity : 1,
                                height: isMobile && scrollY.get() > SCROLL_THRESHOLD ? 0 : 'auto',
                                overflow: 'hidden'
                            }}
                            className={`${isMobile && scrollY.get() > SCROLL_THRESHOLD ? 'hidden' : 'block'} mt-4 md:mt-6 text-center md:text-left`}
                        >
                            <p className="text-lg md:text-2xl text-zinc-500 font-bold tracking-tight mb-4">{data.role}</p>
                            {!isMobile && (
                                <>
                                    <p className="text-zinc-400 text-base leading-relaxed font-light max-w-sm mb-6">{data.bio}</p>
                                    <div className="flex gap-4 justify-center md:justify-start">
                                        {Object.entries(data.socials).map(([key, val]) => {
                                            if (!val) return null;
                                            const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                            return (
                                                <a key={key} href={val as string} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-zinc-900/50 hover:bg-white hover:text-black flex items-center justify-center text-zinc-500 transition-all border border-zinc-800">
                                                    <Icon size={18} />
                                                </a>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                            {isMobile && (
                                 <div className="flex gap-6 justify-center mt-6">
                                     {Object.entries(data.socials).map(([key, val]) => {
                                        if (!val) return null;
                                        const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                        return <a key={key} href={val as string} className="text-zinc-500"><Icon size={24}/></a>
                                     })}
                                 </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>

                 <motion.div 
                    style={{ opacity: useTransform(scrollY, [0, 100], [1, 0]) }}
                    className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-2 pointer-events-none"
                >
                    <span className="text-[9px] font-black tracking-[0.6em] text-zinc-700 uppercase">Scroll</span>
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-zinc-800"><ArrowDown size={16}/></motion.div>
                </motion.div>
            </motion.div>

            {/* SPACER to push content below fold */}
            <div style={{ height: SCROLL_THRESHOLD + (isMobile ? 100 : 0) }} className="w-full pointer-events-none" />

            {/* MAIN CONTENT */}
            <motion.main 
                className={`container mx-auto px-6 md:px-12 pb-48 relative z-10 ${isMobile ? 'pt-12' : 'lg:ml-[30%] lg:w-[70%]'}`}
                style={{ 
                    // Use a simpler opacity transform that doesn't completely hide content if logic breaks
                    opacity: mainOpacity, 
                    y: mainY 
                }}
            >
                {/* 1. SHOWREEL */}
                {data.showreelLink && (
                    <section className="mb-32 md:mb-48">
                        <div className="flex items-center gap-6 mb-10">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-700 whitespace-nowrap">01 // Showreel</h2>
                            <div className="h-px w-full bg-zinc-900" />
                        </div>
                        <div className="w-full rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-900 shadow-2xl relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl opacity-50 animate-pulse" />
                            <div className="relative z-10">
                                <VideoPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} autoplay={true} aspectRatio="16:9" />
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. WORKS */}
                {data.projects && data.projects.length > 0 ? (
                    <section className="mb-32 md:mb-48">
                        <div className="flex items-center gap-6 mb-10">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-700 whitespace-nowrap">02 // Works</h2>
                            <div className="h-px w-full bg-zinc-900" />
                        </div>
                        
                        <div className="columns-1 md:columns-2 gap-6 space-y-6">
                            {data.projects.map((project) => (
                                <motion.div 
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                                    className="break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950 shadow-lg hover:border-zinc-700 transition-colors"
                                    onClick={() => setSelectedProject(project)}
                                >
                                    <div className="relative w-full">
                                        <div className="w-full" style={{ aspectRatio: project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9' }}>
                                             <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform">
                                                <Play size={16} fill="black" className="ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{project.contentType || 'Video'}</span>
                                            {project.type === 'video' && <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">VID</span>}
                                        </div>
                                        <h3 className="text-lg font-display font-bold text-white leading-tight">{project.title}</h3>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                ) : (
                    // Fallback for empty projects to prevent "Blank Page" confusion
                    <section className="mb-32 opacity-50 text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
                        <p className="text-zinc-600 text-sm uppercase tracking-widest">No projects added yet.</p>
                    </section>
                )}

                {/* 3. SKILLS */}
                <section className="mb-32 md:mb-48">
                    <div className="flex items-center gap-6 mb-10">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-700 whitespace-nowrap">03 // Arsenal</h2>
                        <div className="h-px w-full bg-zinc-900" />
                    </div>

                    <div className="space-y-12">
                        {/* Primary Tool */}
                        {data.primaryTool && (
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Core Mastery</h4>
                                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl flex items-center gap-6">
                                    <div className="w-16 h-16 bg-black border border-zinc-800 rounded-xl flex items-center justify-center shadow-2xl">
                                        <ToolIcon name={data.primaryTool} className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h5 className="text-xl font-bold text-white tracking-tight">{data.primaryTool}</h5>
                                        <p className="text-[10px] text-zinc-500 mt-1">Primary Workflow</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Tools */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Production Stack</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {data.tools?.filter(t => t !== data.primaryTool).map((tool) => (
                                    <div key={tool} className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-zinc-900 transition-colors">
                                        <ToolIcon name={tool} className="w-8 h-8" />
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">{tool}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {/* AI Tools */}
                        {data.aiTools && data.aiTools.length > 0 && (
                             <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={12} className="text-yellow-500"/> AI Extensions</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {data.aiTools.map((tool) => (
                                        <div key={tool} className="bg-zinc-950/50 border border-yellow-900/20 p-4 rounded-xl flex flex-col items-center gap-3">
                                            <ToolIcon name={tool} className="w-8 h-8" />
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">{tool}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. CONNECT */}
                <section className="pt-20 border-t border-zinc-900">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                        <div>
                             <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter text-white mb-8">Let's create.</h2>
                             <a href={`mailto:${data.contactEmail}`} className="text-lg md:text-2xl text-zinc-500 hover:text-white transition-colors border-b border-zinc-800 pb-2">
                                {data.contactEmail}
                             </a>
                        </div>
                        <div className="flex flex-col gap-4">
                             <div className="flex gap-4">
                                 {Object.entries(data.socials).map(([key, val]) => {
                                        if (!val) return null;
                                        const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                        return <a key={key} href={val as string} className="text-zinc-600 hover:text-white transition-colors"><Icon size={24}/></a>
                                 })}
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">
                                © {new Date().getFullYear()} {data.name}
                             </p>
                        </div>
                    </div>
                </section>

            </motion.main>
        </div>
    );
};
