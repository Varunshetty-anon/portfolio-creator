import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Mail, Instagram, Twitter, Linkedin, Youtube, Globe, X, Volume2, VolumeX, Loader2, Play, ArrowDown, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { PortfolioData, Project, INITIAL_DATA } from '../../types';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDriveId, getDropboxDirectLink } from '../../lib/utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Helper Components ---

const ToolIcon = React.memo(({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
    const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
    const [imgSrc, setImgSrc] = useState(tool ? `https://cdn.simpleicons.org/${tool.slug}/white` : '');
    
    if (!tool) return <span className={`flex items-center justify-center font-bold text-zinc-600 text-[9px] uppercase border border-zinc-800 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    return <img src={imgSrc} alt={name} className={`${className} object-contain opacity-70 group-hover:opacity-100 transition-opacity`} onError={(e) => (e.currentTarget.style.display = 'none')} />;
});

// Optimized Video Player for Showreel & Projects
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
    
    // Normalize Aspect Ratio for CSS
    const cssAspectRatio = useMemo(() => aspectRatio.replace(':', '/'), [aspectRatio]);

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
            if (autoplay) {
                videoRef.current.play().catch(e => console.warn("Autoplay blocked", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [autoplay, type]);

    const getEmbedSrc = () => {
        const auto = autoplay ? 1 : 0;
        const mute = muted ? 1 : 0;
        
        if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            return `https://www.youtube.com/embed/${ytId}?autoplay=${auto}&mute=${mute}&controls=${controls ? 1 : 0}&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&showinfo=0`;
        }
        if (type === 'vimeo') {
            const vId = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)?.[1];
            return `https://player.vimeo.com/video/${vId}?autoplay=${auto}&muted=${mute}&loop=1&background=${controls ? 0 : 1}&playsinline=1`;
        }
        if (type === 'drive') return `https://drive.google.com/file/d/${getDriveId(src)}/preview`;
        return src;
    };

    return (
        <div className={`relative w-full h-full bg-black overflow-hidden ${className}`} style={{ aspectRatio: cssAspectRatio }}>
            {/* Loading / Thumbnail Layer */}
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div 
                        initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-10 bg-zinc-900"
                    >
                        {thumbnail && <img src={thumbnail} className="w-full h-full object-cover opacity-60 blur-sm" alt="Thumbnail" />}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white/50" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Layer */}
            {(type === 'direct' || type === 'dropbox') ? (
                <video 
                    ref={videoRef}
                    src={type === 'dropbox' ? (getDropboxDirectLink(src) || src) : src} 
                    className="w-full h-full object-cover"
                    loop 
                    muted={muted} 
                    playsInline 
                    preload="metadata"
                    onLoadedData={() => setIsLoaded(true)}
                    controls={controls}
                />
            ) : (
                <iframe 
                    src={getEmbedSrc()} 
                    className="w-full h-full pointer-events-none" // Pointer events none for embeds to prevent hijacking scroll/click, unless modal
                    style={{ pointerEvents: controls ? 'auto' : 'none' }}
                    allow="autoplay; fullscreen" 
                    onLoad={() => setIsLoaded(true)} 
                />
            )}

            {/* Custom Overlay Controls (For Showreel) */}
            {onToggleMute && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                    className="absolute bottom-6 right-6 z-20 p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all border border-white/10"
                >
                    {muted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                </button>
            )}
        </div>
    );
};

// --- Sub-Components ---

const IntroOverlay: React.FC<{ data: PortfolioData; onComplete: () => void }> = ({ data, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
        >
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center"
            >
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-zinc-800 shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-8">
                    <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tighter text-center">{data.name}</h1>
                <p className="text-zinc-500 text-sm tracking-[0.3em] uppercase mt-4">{data.role}</p>
            </motion.div>
        </motion.div>
    );
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            onClick={onClick}
            className="group cursor-pointer flex flex-col gap-3"
        >
            <div 
                className="relative w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl"
                style={{ aspectRatio: project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9' }}
            >
                {/* Image */}
                <img 
                    src={project.thumbnail} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                    alt={project.title}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                     <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2 block">{project.contentType}</span>
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg leading-tight">{project.title}</h3>
                            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                                <Play size={16} fill="currentColor" />
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- Main View ---

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
    const safeData = useMemo(() => ({ ...INITIAL_DATA, ...data }), [data]);
    const [introComplete, setIntroComplete] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isShowreelMuted, setIsShowreelMuted] = useState(true);

    useEffect(() => {
        if (!isPreview && safeData.uid) trackPortfolioView(safeData.uid);
        document.body.style.overflow = selectedProject || !introComplete ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; }
    }, [selectedProject, safeData.uid, isPreview, introComplete]);

    return (
        <div className="bg-[#030303] min-h-screen w-full relative text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-white">
            
            {/* Intro Animation */}
            <AnimatePresence>
                {!introComplete && (
                    <IntroOverlay data={safeData} onComplete={() => setIntroComplete(true)} />
                )}
            </AnimatePresence>

            {/* Project Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[50] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setSelectedProject(null)}
                    >
                        <button className="absolute top-6 right-6 z-50 p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                        
                        <div className="w-full max-w-6xl max-h-[90vh] flex flex-col lg:flex-row bg-[#09090b] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex-1 bg-black relative flex items-center justify-center">
                                <div className="w-full h-full max-h-[70vh] lg:max-h-full aspect-video">
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
                            <div className="w-full lg:w-[350px] p-8 border-l border-zinc-800 overflow-y-auto bg-zinc-900/50">
                                <h2 className="text-3xl font-display font-bold text-white mb-2">{selectedProject.title}</h2>
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-6 block">{selectedProject.contentType}</span>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-8">{selectedProject.description}</p>
                                
                                {selectedProject.softwareUsed && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Tools Used</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProject.softwareUsed.map(t => (
                                                <span key={t} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[10px] text-zinc-300">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT */}
            <motion.div 
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: introComplete ? 1 : 0, filter: introComplete ? 'blur(0px)' : 'blur(10px)' }}
                transition={{ duration: 1 }}
                className="flex flex-col lg:flex-row min-h-screen"
            >
                {/* --- LEFT SIDEBAR (Sticky Identity) --- */}
                <aside className="lg:w-[35%] xl:w-[30%] lg:h-screen lg:sticky lg:top-0 border-r border-zinc-900/50 flex flex-col justify-between p-8 lg:p-12 z-20 bg-[#030303]">
                    <div>
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-800">
                                <img src={safeData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-3xl text-white leading-none">{safeData.name}</h1>
                                <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">{safeData.role}</p>
                            </div>
                        </div>
                        
                        <p className="text-zinc-400 text-base leading-relaxed font-light mb-8 max-w-sm">
                            {safeData.bio}
                        </p>

                        <div className="flex flex-wrap gap-3">
                             {safeData.socials && Object.entries(safeData.socials).map(([key, val]) => {
                                if (!val) return null;
                                const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                return (
                                    <a key={key} href={val as string} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium hover:bg-white hover:text-black transition-all group">
                                        <Icon size={14} />
                                        <span className="capitalize hidden sm:inline">{key}</span>
                                        <ArrowRight size={10} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                    
                    <div className="hidden lg:block">
                        <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-2">Available for work</div>
                        <a href={`mailto:${safeData.contactEmail}`} className="text-xl text-white hover:text-indigo-400 transition-colors font-display font-bold">
                            {safeData.contactEmail}
                        </a>
                    </div>
                </aside>

                {/* --- RIGHT CONTENT (Scrollable) --- */}
                <main className="flex-1 min-w-0 bg-[#030303] relative">
                    
                    {/* 1. Cinematic Showreel */}
                    {safeData.showreelLink && (
                        <section className="w-full border-b border-zinc-900/50">
                           <div className="w-full aspect-video md:aspect-[21/9] lg:aspect-[16/7] relative overflow-hidden group">
                                <VideoPlayer 
                                    src={safeData.showreelLink} 
                                    thumbnail={safeData.showreelThumbnail} 
                                    autoplay={introComplete} // Only play after intro
                                    muted={isShowreelMuted}
                                    onToggleMute={() => setIsShowreelMuted(!isShowreelMuted)}
                                    className="scale-105 group-hover:scale-100 transition-transform duration-[2s]"
                                />
                                <div className="absolute top-6 left-6 z-20 bg-black/50 backdrop-blur px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                                    Showreel 2024
                                </div>
                           </div>
                        </section>
                    )}

                    <div className="p-6 md:p-12 lg:p-16 space-y-24">
                        
                        {/* 2. Selected Works Grid */}
                        {safeData.projects && safeData.projects.length > 0 && (
                            <section>
                                <div className="flex items-end justify-between mb-8 border-b border-zinc-900 pb-4">
                                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Selected Works</h2>
                                    <span className="text-zinc-500 text-sm hidden md:block">{safeData.projects.length} Projects</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 auto-rows-max">
                                    {safeData.projects.map((project) => (
                                        <ProjectCard 
                                            key={project.id} 
                                            project={project} 
                                            onClick={() => setSelectedProject(project)} 
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. Toolset */}
                        <section>
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Technical Arsenal</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {safeData.primaryTool && (
                                     <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                                        <div className="p-2 bg-black rounded-lg border border-zinc-800">
                                            <ToolIcon name={safeData.primaryTool} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-white block">{safeData.primaryTool}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase">Primary</span>
                                        </div>
                                    </div>
                                )}
                                {safeData.tools?.filter(t => t !== safeData.primaryTool).map(tool => (
                                    <div key={tool} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                                        <ToolIcon name={tool} />
                                        <span className="text-xs font-medium text-zinc-400">{tool}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Mobile Footer */}
                        <div className="lg:hidden pt-12 border-t border-zinc-900">
                            <h2 className="text-2xl font-display font-bold text-white mb-4">Let's Work Together</h2>
                             <a href={`mailto:${safeData.contactEmail}`} className="text-lg text-zinc-400 hover:text-white transition-colors">
                                {safeData.contactEmail}
                            </a>
                        </div>

                    </div>
                    
                    {/* Footer Credits */}
                    <div className="p-6 md:p-12 border-t border-zinc-900 bg-[#030303] flex justify-between items-center text-[10px] text-zinc-600 uppercase tracking-widest">
                         <span>© {new Date().getFullYear()} {safeData.name}</span>
                         <span>Frames Studio</span>
                    </div>

                </main>
            </motion.div>
        </div>
    );
};