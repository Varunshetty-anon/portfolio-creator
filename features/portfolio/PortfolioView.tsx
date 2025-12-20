import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Mail, Instagram, Twitter, Linkedin, Youtube, Globe, X, Volume2, VolumeX, Loader2, Play, ExternalLink, ArrowDown, Sparkles } from 'lucide-react';
import { PortfolioData, Project, INITIAL_DATA } from '../../types';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDriveId, getDropboxDirectLink } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Components ---

const ToolIcon = React.memo(({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
    const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
    const [imgSrc, setImgSrc] = useState(tool ? `https://cdn.simpleicons.org/${tool.slug}/white` : '');
    
    if (!tool) return <span className={`flex items-center justify-center font-bold text-zinc-600 text-[9px] uppercase border border-zinc-800 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    return <img src={imgSrc} alt={name} className={`${className} object-contain opacity-70 group-hover:opacity-100 transition-opacity`} onError={(e) => (e.currentTarget.style.display = 'none')} />;
});

const VideoPlayer: React.FC<{ src: string; thumbnail: string; autoplay?: boolean; isModal?: boolean; aspectRatio?: string }> = ({ src, thumbnail, autoplay = false, isModal = false, aspectRatio = '16/9' }) => {
    const [isReady, setIsReady] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
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

    useEffect(() => {
        if ((type === 'direct' || type === 'dropbox') && videoRef.current) {
            if (autoplay && isInView) {
                videoRef.current.play().catch(() => setIsMuted(true));
            } else if (!isModal) {
                videoRef.current.pause();
            }
        }
    }, [isInView, type, autoplay, isModal]);

    const getEmbedSrc = () => {
        if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            return `https://www.youtube.com/embed/${ytId}?autoplay=${autoplay && isInView ? 1 : 0}&mute=1&controls=${isModal ? 1 : 0}&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1`;
        }
        if (type === 'vimeo') {
            const vId = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)?.[1];
            return `https://player.vimeo.com/video/${vId}?autoplay=${autoplay && isInView ? 1 : 0}&muted=1&loop=1&background=${isModal ? 0 : 1}&playsinline=1`;
        }
        if (type === 'drive') return `https://drive.google.com/file/d/${getDriveId(src)}/preview`;
        return src;
    };

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full bg-zinc-950 overflow-hidden ${!isModal ? 'rounded-xl md:rounded-2xl' : ''}`}
            style={{ aspectRatio: isModal ? undefined : aspectRatio.replace(':', '/') }}
        >
            <AnimatePresence>
                {!isReady && (
                    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-zinc-900 flex items-center justify-center">
                        {thumbnail && <img src={thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-xl scale-110" />}
                        <Loader2 className="animate-spin text-zinc-500 relative z-30" />
                    </motion.div>
                )}
            </AnimatePresence>

            {(type === 'direct' || type === 'dropbox') ? (
                <div className="w-full h-full relative group">
                    <video 
                        ref={videoRef} src={type === 'dropbox' ? (getDropboxDirectLink(src) || src) : src} 
                        className="w-full h-full object-cover"
                        loop muted={isMuted} playsInline preload="metadata"
                        onLoadedData={() => setIsReady(true)}
                    />
                    {isModal && (
                        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute bottom-6 right-6 z-30 p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all">
                            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                        </button>
                    )}
                </div>
            ) : (
                <iframe src={getEmbedSrc()} className="w-full h-full" allow="autoplay; fullscreen" onLoad={() => setIsReady(true)} />
            )}
        </div>
    );
};

const ProjectModal: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    return (
        <motion.div 
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        >
            <button className="absolute top-4 right-4 z-50 p-3 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"><X size={24} /></button>
            <motion.div 
                className="bg-[#09090b] w-full max-w-6xl max-h-[90vh] rounded-3xl border border-zinc-800 overflow-hidden flex flex-col lg:flex-row shadow-2xl"
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
            >
                <div className="flex-1 bg-black flex items-center justify-center relative min-h-[40vh]">
                     <div className="w-full h-full flex items-center justify-center">
                         <VideoPlayer src={project.link} thumbnail={project.thumbnail} autoplay={true} isModal={true} aspectRatio={project.aspectRatio} />
                     </div>
                </div>
                <div className="w-full lg:w-[400px] bg-zinc-900/50 border-t lg:border-t-0 lg:border-l border-zinc-800 p-8 lg:p-10 overflow-y-auto shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4 block">{project.contentType || 'Project'}</span>
                    <h2 className="text-3xl font-display font-bold text-white mb-6 leading-tight">{project.title}</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">{project.description}</p>
                    {project.softwareUsed && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Tools</h4>
                            <div className="flex flex-wrap gap-2">
                                {project.softwareUsed.map(t => <span key={t} className="px-3 py-1 bg-zinc-800 rounded-md text-[10px] text-zinc-300 border border-zinc-700">{t}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main View ---

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
    const safeData = useMemo(() => ({ ...INITIAL_DATA, ...data }), [data]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const { scrollY } = useScroll();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (!isPreview && safeData.uid) trackPortfolioView(safeData.uid);
        document.body.style.overflow = selectedProject ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; }
    }, [selectedProject, safeData.uid, isPreview]);

    // --- Physics Animations ---
    const springConfig = { stiffness: 100, damping: 20, mass: 1 };
    
    // Desktop: Sidebar Width 100% -> 25%
    const desktopWidth = useSpring(useTransform(scrollY, [0, 600], ["100%", "28%"]), springConfig);
    const desktopLogoScale = useSpring(useTransform(scrollY, [0, 600], [1, 0.5]), springConfig);
    const desktopContentOpacity = useSpring(useTransform(scrollY, [0, 400], [1, 0]), springConfig); // Fades out extra bio details on scroll
    
    // Mobile: Header Height 100vh -> 80px
    const mobileHeight = useSpring(useTransform(scrollY, [0, 400], ["100vh", "84px"]), springConfig);
    const mobileLogoScale = useSpring(useTransform(scrollY, [0, 400], [1.5, 0.4]), springConfig);
    const mobileContentOpacity = useSpring(useTransform(scrollY, [0, 200], [1, 0]), springConfig);

    return (
        <div className="bg-[#050505] min-h-screen w-full relative text-zinc-100 font-sans selection:bg-white/20">
            <AnimatePresence>
                {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
            </AnimatePresence>

            {/* --- HERO / SIDEBAR CONTAINER --- */}
            <motion.header
                className="fixed top-0 left-0 z-40 bg-[#050505] border-b lg:border-b-0 lg:border-r border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-center lg:justify-start lg:pt-0"
                style={{
                    width: isMobile ? "100%" : desktopWidth,
                    height: isMobile ? mobileHeight : "100vh",
                    justifyContent: isMobile ? 'center' : 'center', // Initially center, logic handled by inner container placement
                }}
            >
                {/* Content Wrapper */}
                <div className={`relative w-full max-w-lg mx-auto flex flex-col items-center text-center p-6 transition-all duration-500 ${isMobile ? '' : 'lg:h-screen lg:justify-center'}`}>
                    
                    {/* Dynamic Profile Image */}
                    <motion.div 
                        className="rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl relative z-10 shrink-0"
                        style={{
                            width: 200, height: 200,
                            scale: isMobile ? mobileLogoScale : desktopLogoScale,
                            marginBottom: isMobile ? 0 : 30 // Gap managed by scale
                        }}
                    >
                        <img src={safeData.profileImage} className="w-full h-full object-cover" alt={safeData.name} />
                    </motion.div>

                    {/* Text Content - Fades out on Mobile Header state, shrinks on Desktop Sidebar state */}
                    <motion.div className="flex flex-col items-center" style={{ scale: isMobile ? mobileLogoScale : desktopLogoScale, originY: 0 }}>
                        <h1 className="font-display font-bold text-5xl tracking-tighter text-white mt-6 mb-2 leading-none whitespace-nowrap">{safeData.name}</h1>
                        <p className="text-zinc-500 font-medium tracking-[0.2em] text-sm uppercase">{safeData.role}</p>
                    </motion.div>

                    {/* Extended Details - Only visible when Hero is expanded or Desktop Sidebar is large */}
                    <motion.div 
                        style={{ opacity: isMobile ? mobileContentOpacity : desktopContentOpacity }}
                        className="flex flex-col items-center gap-8 mt-8 w-full"
                    >
                        <div className="w-12 h-px bg-zinc-800"/>
                        <p className="text-zinc-400 text-base leading-relaxed font-light max-w-xs">{safeData.bio}</p>
                        
                        <div className="flex gap-4">
                            {safeData.socials && Object.entries(safeData.socials).map(([key, val]) => {
                                if (!val) return null;
                                const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                return <a key={key} href={val as string} target="_blank" className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-white hover:text-black transition-all"><Icon size={18}/></a>
                            })}
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 mt-8 animate-bounce opacity-30">
                             <span className="text-[9px] uppercase tracking-widest text-zinc-500">Scroll</span>
                             <ArrowDown size={14} className="text-zinc-500" />
                        </div>
                    </motion.div>
                </div>
            </motion.header>

            {/* --- SCROLL SPACER --- */}
            {/* Creates the height for the initial scroll effect */}
            <div style={{ height: '100vh' }} />

            {/* --- MAIN CONTENT --- */}
            <main 
                className="relative z-10 p-6 md:p-12 lg:p-24 pb-48 transition-all duration-500"
                style={{
                    marginLeft: isMobile ? 0 : '28%', // Align right of sidebar
                    width: isMobile ? '100%' : '72%',
                    paddingTop: isMobile ? '120px' : '6rem'
                }}
            >
                {/* 1. Showreel */}
                {safeData.showreelLink && (
                    <section className="mb-32">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"/>
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Showreel</h2>
                        </div>
                        <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 ring-1 ring-white/5">
                            <VideoPlayer src={safeData.showreelLink} thumbnail={safeData.showreelThumbnail} autoplay={true} aspectRatio="16:9" />
                        </div>
                    </section>
                )}

                {/* 2. Works - Masonry Grid */}
                {safeData.projects && safeData.projects.length > 0 && (
                     <section className="mb-32">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"/>
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Selected Works</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {safeData.projects.map((project) => (
                                <div 
                                    key={project.id}
                                    onClick={() => setSelectedProject(project)}
                                    className="group cursor-pointer flex flex-col gap-3"
                                >
                                    <div className="relative w-full rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-white/5 transition-transform duration-500 group-hover:-translate-y-1 shadow-lg">
                                        <div className="w-full" style={{ aspectRatio: project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9' }}>
                                            {project.thumbnail && <img src={project.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                                        </div>
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-all duration-300">
                                                <Play size={16} fill="black" className="ml-0.5 text-black"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-1">
                                        <h3 className="font-display font-bold text-lg text-zinc-200 leading-tight group-hover:text-white transition-colors">{project.title}</h3>
                                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wide">{project.contentType}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. Skills */}
                <section className="mb-32">
                    <div className="flex items-center gap-4 mb-10">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"/>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Arsenal</h2>
                    </div>

                    <div className="space-y-12">
                        {safeData.primaryTool && (
                            <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl flex items-center gap-6">
                                <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center shadow-lg">
                                    <ToolIcon name={safeData.primaryTool} className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">{safeData.primaryTool}</h4>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Core Workflow</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {safeData.tools?.filter(t => t !== safeData.primaryTool).map(tool => (
                                <div key={tool} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                                    <ToolIcon name={tool} />
                                    <span className="text-xs font-medium text-zinc-400">{tool}</span>
                                </div>
                            ))}
                        </div>

                         {safeData.aiTools && safeData.aiTools.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={10} /> AI Enhanced</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {safeData.aiTools.map(tool => (
                                        <div key={tool} className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-3">
                                            <ToolIcon name={tool} />
                                            <span className="text-xs font-medium text-indigo-200">{tool}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Contact CTA */}
                <section className="border-t border-zinc-900 pt-16">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 tracking-tight">Let's create together.</h2>
                    <a href={`mailto:${safeData.contactEmail}`} className="text-xl md:text-2xl text-zinc-500 hover:text-white transition-colors border-b border-zinc-800 pb-1 hover:border-white">
                        {safeData.contactEmail}
                    </a>
                </section>
            </main>
        </div>
    );
};