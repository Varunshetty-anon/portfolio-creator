import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
    Mail, Instagram, Twitter, Linkedin, Youtube, Globe, MapPin, 
    Volume2, VolumeX, Loader2, Play, ArrowUpRight, Sparkles, X 
} from 'lucide-react';
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
    
    const cssAspectRatio = useMemo(() => aspectRatio ? aspectRatio.replace(':', '/') : '16/9', [aspectRatio]);

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
                videoRef.current.play().catch(() => {});
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
        <div className={`relative w-full h-full bg-[#050505] overflow-hidden ${className}`} style={{ aspectRatio: cssAspectRatio }}>
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div 
                        initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-10 bg-[#09090b]"
                    >
                        {thumbnail && <img src={thumbnail} className="w-full h-full object-cover opacity-60 blur-lg scale-110" alt="Thumbnail" />}
                    </motion.div>
                )}
            </AnimatePresence>

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
                    className="w-full h-full pointer-events-none"
                    style={{ pointerEvents: controls ? 'auto' : 'none' }}
                    allow="autoplay; fullscreen" 
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

const IntroOverlay: React.FC<{ data: PortfolioData; onComplete: () => void }> = ({ data, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2200);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6"
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center gap-6"
            >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-zinc-800 shadow-2xl">
                    <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">{data.name}</h1>
                    <div className="h-0.5 w-12 bg-white/20 mx-auto rounded-full" />
                </div>
            </motion.div>
        </motion.div>
    );
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            onClick={onClick}
            className="group cursor-pointer relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg"
            style={{ aspectRatio: project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9' }}
        >
            <img 
                src={project.thumbnail} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={project.title}
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
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isShowreelMuted, setIsShowreelMuted] = useState(true);

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
                    <IntroOverlay data={safeData} onComplete={() => setIntroComplete(true)} />
                )}
            </AnimatePresence>

            {/* Modal */}
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
                            <div className="flex-1 bg-black relative flex items-center justify-center min-h-[40vh] lg:min-h-0">
                                <div className="w-full h-full max-h-[85vh] flex items-center justify-center">
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
                {/* --- SIDEBAR (Desktop Sticky / Mobile Stacked) --- */}
                <aside className="
                    w-full lg:w-[35%] xl:w-[32%] 
                    lg:h-screen lg:sticky lg:top-0 
                    bg-[#050505] border-b lg:border-b-0 lg:border-r border-zinc-900 
                    p-8 md:p-12 xl:p-16 
                    flex flex-col lg:justify-between gap-12 lg:gap-0
                    z-10
                ">
                    <div className="space-y-8 lg:space-y-10">
                        {/* Avatar */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-zinc-800 shadow-2xl ring-4 ring-zinc-900/50">
                            <img src={safeData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                        </div>

                        {/* Identity */}
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter leading-[0.9]">
                                {safeData.name}
                            </h1>
                            
                            {/* Meta Row */}
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
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
                                return (
                                    <a 
                                        key={key} 
                                        href={val as string} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-white hover:border-white transition-all duration-300 group"
                                    >
                                        <Icon size={18} className="group-hover:scale-110 transition-transform" />
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

                    {/* 2. Work Grid */}
                    <div className="p-6 md:p-12 xl:p-16 space-y-20">
                        {safeData.projects && safeData.projects.length > 0 && (
                            <section>
                                <div className="flex items-end justify-between mb-10">
                                    <h2 className="text-4xl font-display font-bold text-white tracking-tight">My Work</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-12">
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

                        {/* 3. Tech Stack (Simplified) */}
                        <section className="pt-12 border-t border-zinc-900">
                             <div className="flex flex-wrap gap-4 items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-600 mr-4">Proficiency</span>
                                {safeData.primaryTool && (
                                     <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                                        <ToolIcon name={safeData.primaryTool} />
                                        <span className="text-xs font-bold text-white">{safeData.primaryTool}</span>
                                    </div>
                                )}
                                {safeData.tools?.filter(t => t !== safeData.primaryTool).map(tool => (
                                    <div key={tool} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-500">
                                        <ToolIcon name={tool} className="w-4 h-4" />
                                        <span className="text-xs font-medium">{tool}</span>
                                    </div>
                                ))}
                             </div>
                        </section>
                        
                        {/* Mobile Only Footer */}
                        <div className="lg:hidden pt-8 border-t border-zinc-900">
                            <h2 className="text-2xl font-display font-bold text-white mb-2">Let's Create.</h2>
                            <a href={`mailto:${safeData.contactEmail}`} className="text-lg text-zinc-500">{safeData.contactEmail}</a>
                        </div>
                    </div>

                </main>
            </motion.div>
        </div>
    );
};