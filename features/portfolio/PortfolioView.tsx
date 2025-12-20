import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { Mail, Instagram, Twitter, Linkedin, Youtube, Globe, X, Volume2, VolumeX, Loader2, Play, ArrowDown, Sparkles } from 'lucide-react';
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
                        controls={isModal}
                    />
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
    
    // --- Layout Transforms ---
    // Desktop: Sidebar transition
    const desktopLogoScale = useTransform(scrollY, [0, 400], [1, 0.6]);
    const desktopTextOpacity = useTransform(scrollY, [0, 200], [1, 0]);
    
    // Mobile: Header transition
    const mobileHeaderHeight = useTransform(scrollY, [0, 300], [400, 80]);
    const mobileLogoScale = useTransform(scrollY, [0, 300], [1, 0.4]);
    const mobileTextOpacity = useTransform(scrollY, [0, 150], [1, 0]);

    useEffect(() => {
        if (!isPreview && safeData.uid) trackPortfolioView(safeData.uid);
        document.body.style.overflow = selectedProject ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; }
    }, [selectedProject, safeData.uid, isPreview]);

    return (
        <div className="bg-[#050505] min-h-screen w-full relative text-zinc-100 font-sans selection:bg-white/20">
            <AnimatePresence>
                {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
            </AnimatePresence>

            {/* --- LAYOUT STRUCTURE --- */}
            <div className="flex flex-col lg:flex-row min-h-screen">
                
                {/* --- SIDEBAR / HEADER (STICKY) --- */}
                {/* 
                   Mobile: Sticky Header at Top
                   Desktop: Sticky Sidebar at Left
                */}
                <motion.aside 
                    className="sticky top-0 z-30 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-zinc-900 bg-[#050505] overflow-hidden shadow-2xl lg:shadow-none"
                    style={{
                        height: mobileHeaderHeight, // Dynamic on Mobile
                        width: '100%', // Full width on Mobile
                    }}
                    // Desktop Override via Tailwind classes for fixed width/height
                    // Note: Framer Motion style override takes precedence, so we use a media query conditioned logic or css modules.
                    // Instead, simplified: Let's rely on standard classes for Desktop and use motion for mobile height
                >
                    <div className="hidden lg:flex flex-col items-center justify-center w-full h-screen sticky top-0 lg:w-[400px] shrink-0 p-8">
                         {/* DESKTOP CONTENT */}
                        <motion.div style={{ scale: desktopLogoScale }} className="relative z-10">
                            <div className="w-48 h-48 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl mb-8 mx-auto">
                                <img src={safeData.profileImage} className="w-full h-full object-cover" alt={safeData.name} />
                            </div>
                            <div className="text-center">
                                <h1 className="font-display font-bold text-5xl tracking-tighter text-white mb-2">{safeData.name}</h1>
                                <p className="text-zinc-500 font-medium tracking-[0.2em] text-sm uppercase">{safeData.role}</p>
                            </div>
                        </motion.div>

                        <motion.div style={{ opacity: desktopTextOpacity }} className="mt-8 flex flex-col items-center gap-6 max-w-xs text-center">
                             <div className="w-12 h-px bg-zinc-800"/>
                             <p className="text-zinc-400 text-sm leading-relaxed font-light">{safeData.bio}</p>
                             <div className="flex gap-4">
                                {safeData.socials && Object.entries(safeData.socials).map(([key, val]) => {
                                    if (!val) return null;
                                    const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                    return <a key={key} href={val as string} target="_blank" className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-white hover:text-black transition-all"><Icon size={16}/></a>
                                })}
                            </div>
                            <div className="mt-8 animate-bounce opacity-30">
                                <ArrowDown size={16} />
                            </div>
                        </motion.div>
                    </div>

                    {/* MOBILE CONTENT (Visible only on small screens via CSS/Height logic) */}
                    <div className="lg:hidden w-full h-full flex flex-col items-center justify-center p-6 relative">
                         <motion.div style={{ scale: mobileLogoScale }} className="origin-top">
                            <div className="w-32 h-32 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden shadow-lg mx-auto mb-4">
                                <img src={safeData.profileImage} className="w-full h-full object-cover" alt={safeData.name} />
                            </div>
                             <div className="text-center">
                                <h1 className="font-display font-bold text-3xl tracking-tighter text-white">{safeData.name}</h1>
                            </div>
                         </motion.div>
                         
                         <motion.div style={{ opacity: mobileTextOpacity }} className="text-center mt-4">
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-4">{safeData.role}</p>
                            <p className="text-zinc-400 text-sm max-w-xs mx-auto line-clamp-3">{safeData.bio}</p>
                         </motion.div>
                    </div>
                </motion.aside>

                {/* --- MAIN SCROLLABLE CONTENT --- */}
                <main className="flex-1 bg-[#050505] relative z-10 w-full">
                    {/* Spacer for Desktop to allow Hero to shine initially */}
                    <div className="hidden lg:block h-[40vh]" /> 

                    <div className="p-6 md:p-12 lg:p-20 pb-48 max-w-5xl mx-auto space-y-32">
                        
                        {/* 1. Showreel */}
                        {safeData.showreelLink && (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"/>
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Showreel</h2>
                                </div>
                                <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 ring-1 ring-white/5">
                                    <VideoPlayer src={safeData.showreelLink} thumbnail={safeData.showreelThumbnail} autoplay={true} aspectRatio="16:9" />
                                </div>
                            </section>
                        )}

                        {/* 2. Works */}
                        {safeData.projects && safeData.projects.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"/>
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Selected Works</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {safeData.projects.map((project) => (
                                        <div 
                                            key={project.id}
                                            onClick={() => setSelectedProject(project)}
                                            className="group cursor-pointer flex flex-col gap-4"
                                        >
                                            <div className="relative w-full rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-white/5 transition-transform duration-300 group-hover:-translate-y-1 shadow-lg">
                                                <div className="w-full" style={{ aspectRatio: project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9' }}>
                                                    {project.thumbnail && <img src={project.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                                                </div>
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                                                        <Play size={16} fill="white" className="ml-0.5 text-white"/>
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
                        <section>
                            <div className="flex items-center gap-4 mb-10">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"/>
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Arsenal</h2>
                            </div>

                            <div className="space-y-12">
                                {safeData.primaryTool && (
                                    <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl flex items-center gap-6">
                                        <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                            <ToolIcon name={safeData.primaryTool} className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white">{safeData.primaryTool}</h4>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Core Workflow</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {safeData.tools?.filter(t => t !== safeData.primaryTool).map(tool => (
                                        <div key={tool} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                                            <ToolIcon name={tool} />
                                            <span className="text-xs font-medium text-zinc-400">{tool}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* 4. Contact CTA */}
                        <section className="border-t border-zinc-900 pt-16">
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-8 tracking-tight">Let's create together.</h2>
                            <a href={`mailto:${safeData.contactEmail}`} className="text-xl md:text-2xl text-zinc-500 hover:text-white transition-colors border-b border-zinc-800 pb-1 hover:border-white break-all">
                                {safeData.contactEmail}
                            </a>
                        </section>

                    </div>
                </main>
            </div>
        </div>
    );
};