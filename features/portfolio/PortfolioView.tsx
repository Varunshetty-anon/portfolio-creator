import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Globe, Maximize2, Star, Sparkles, MonitorPlay, ArrowDown, Loader2 } from 'lucide-react';
import { PortfolioData, Project } from '../../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDriveId, getDropboxDirectLink, getAspectRatioFromDims } from '../../lib/utils';

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

// --- Showreel Player (Adaptive Aspect Ratio) ---
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
            videoRef.current.muted = true;
            if (isInView) videoRef.current.play().catch(() => {});
            else videoRef.current.pause();
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
        if (type === 'drive') return `https://drive.google.com/file/d/${getDriveId(src)}/preview`;
        return src;
    };

    return (
        <motion.div 
            ref={containerRef}
            className="relative w-full rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group"
            style={{ aspectRatio: '16/9' }} // Default, can be dynamic if we knew ratio beforehand easily
        >
             {/* Loading / Thumbnail Overlay */}
             <div className={`absolute inset-0 z-20 transition-opacity duration-700 pointer-events-none ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}>
                <img src={thumbnail || "https://picsum.photos/800/450"} className="w-full h-full object-cover" alt="Loading" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/50" />
                </div>
            </div>

            {type === 'direct' || type === 'dropbox' ? (
                <>
                    <video 
                        ref={videoRef}
                        src={directSrc}
                        className="w-full h-full object-cover"
                        loop muted={isMuted} playsInline
                        onCanPlay={() => setIsVideoReady(true)}
                    />
                    <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted; }} className="absolute bottom-4 right-4 z-30 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                        {isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                    </button>
                </>
            ) : (
                <iframe src={getEmbedSrc()} className="w-full h-full" allow="autoplay; fullscreen" onLoad={() => setTimeout(() => setIsVideoReady(true), 1500)} />
            )}
        </motion.div>
    );
});

// --- Project Card (Collage) ---
const CollageProjectCard: React.FC<{ project: Project; onClick: () => void }> = React.memo(({ project, onClick }) => {
    // Determine spans based on aspect ratio
    const isPortrait = project.aspectRatio === '9:16';
    const isWide = project.aspectRatio === '16:9' || !project.aspectRatio;
    const isSquare = project.aspectRatio === '1:1';
    
    // Grid Spans
    // Portrait: tall (row-span-2)
    // Wide: wide (col-span-2 if possible, or just standard flow)
    // We'll use CSS grid classes. Note: row-span-2 works best in a dense grid.
    
    let gridClass = "col-span-1 row-span-1";
    if (isPortrait) gridClass = "col-span-1 row-span-2";
    
    return (
        <motion.div 
            className={`relative group cursor-pointer bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 ${gridClass}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "0px" }}
            onClick={onClick}
        >
            <div className="absolute inset-0 z-0">
                <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity z-10" />
            
            <div className="absolute bottom-0 left-0 w-full p-4 z-20 translate-y-2 group-hover:translate-y-0 transition-transform">
                 {(project.contentType || project.category) && <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-1 block">{project.contentType || project.category}</span>}
                 <h3 className="text-sm font-bold text-white leading-tight">{project.title}</h3>
            </div>
        </motion.div>
    )
});

// --- Lightbox ---
const Lightbox: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    const driveEmbed = getDriveEmbedUrl(project.link);
    const dropboxDirect = getDropboxDirectLink(project.link);

    // Calculate container aspect ratio style
    const getRatioStyle = () => {
        switch(project.aspectRatio) {
            case '9:16': return { aspectRatio: '9/16', maxHeight: '85vh', maxWidth: '48vh' };
            case '4:3': return { aspectRatio: '4/3', maxHeight: '85vh', maxWidth: '113vh' };
            case '1:1': return { aspectRatio: '1/1', maxHeight: '85vh', maxWidth: '85vh' };
            default: return { aspectRatio: '16/9', maxHeight: '85vh', maxWidth: '150vh' };
        }
    };

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
                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-w-6xl w-full max-h-[90vh]" 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Media Container - Flex center with dynamic aspect ratio box */}
                <div className="flex-1 bg-black flex items-center justify-center p-4 overflow-hidden relative">
                    <div className="w-full relative mx-auto" style={getRatioStyle()}>
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

                {/* Details Sidebar */}
                <div className="w-full md:w-80 lg:w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="mb-6">
                            {project.contentType && <span className="text-[10px] font-bold uppercase text-indigo-400 mb-2 block">{project.contentType}</span>}
                            <h2 className="text-2xl font-display font-bold text-white mb-4">{project.title}</h2>
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
    
    // --- Scroll Transforms ---
    // The spacer is 100vh.
    // 0 -> 100vh : Profile moves from Center to Sticky Left/Top
    
    // Desktop: Center (50%) -> Left (0% + margin)
    // Note: We use a fixed container. 
    // Initial: left: 50%, x: -50%
    // Final: left: 0%, x: 0% (plus some padding handled by layout)
    const dLeft = useTransform(scrollY, [0, window.innerHeight], ["50%", "0%"]);
    const dX = useTransform(scrollY, [0, window.innerHeight], ["-50%", "0%"]);
    const dWidth = useTransform(scrollY, [0, window.innerHeight], ["100%", "33.333%"]); // Full width to 1/3 width
    const dAlign = useTransform(scrollY, [0, window.innerHeight], ["center", "flex-start"]); // justify-content
    
    // Mobile: Center -> Top Header
    const mHeight = useTransform(scrollY, [0, 300], ["100vh", "80px"]);
    const mBg = useTransform(scrollY, [200, 300], ["rgba(5,5,5,0)", "rgba(5,5,5,0.95)"]);
    const mBackdrop = useTransform(scrollY, [200, 300], ["blur(0px)", "blur(12px)"]);
    const mAvatarSize = useTransform(scrollY, [0, 300], [128, 40]);
    const mNameSize = useTransform(scrollY, [0, 300], [2, 1.2]); // Rem scale roughly
    const mOpacity = useTransform(scrollY, [0, 150], [1, 0]); // Hide bio/details on scroll
    
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

             {/* --- Desktop Hero / Sticky Sidebar --- */}
             <motion.div 
                className="hidden lg:flex fixed top-0 h-full z-20 flex-col px-12 py-12 pointer-events-none"
                style={{ left: dLeft, x: dX, width: dWidth, alignItems: dAlign, justifyContent: 'center' }}
             >
                 {/* Inner container needs pointer-events-auto */}
                 <div className="pointer-events-auto flex flex-col max-w-md text-center lg:text-left items-center lg:items-start transition-all duration-500">
                     <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 mb-8 relative shrink-0">
                        <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                     </div>
                     <h1 className="text-5xl lg:text-6xl font-display font-black tracking-tighter uppercase leading-[0.9] mb-4">{data.name}</h1>
                     <p className="text-xl text-zinc-400 font-medium tracking-tight mb-6">{data.role}</p>
                     <p className="text-zinc-500 text-sm leading-relaxed mb-8 font-light max-w-xs lg:max-w-sm">{data.bio}</p>
                     
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
                 </div>
             </motion.div>

             {/* --- Mobile Hero / Sticky Header --- */}
             <motion.div 
                className="lg:hidden fixed top-0 w-full z-40 flex flex-col items-center justify-center overflow-hidden border-b border-zinc-800/0 pointer-events-none"
                style={{ height: mHeight, backgroundColor: mBg, backdropFilter: mBackdrop, borderColor: useTransform(scrollY, [200, 201], ["transparent", "#27272a"]) }}
             >
                 <div className="pointer-events-auto flex flex-col items-center p-4">
                     <motion.div style={{ width: mAvatarSize, height: mAvatarSize }} className="rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 mb-4 shadow-xl">
                        <img src={data.profileImage} className="w-full h-full object-cover" />
                     </motion.div>
                     <motion.h1 style={{ scale: mNameSize }} className="font-display font-black tracking-tighter uppercase leading-none origin-top">{data.name}</motion.h1>
                     
                     {/* Fading details for scroll */}
                     <motion.div style={{ opacity: mOpacity, height: useTransform(scrollY, [0, 150], ["auto", 0]), overflow: "hidden" }} className="flex flex-col items-center">
                         <p className="text-zinc-400 text-sm mt-2 mb-4">{data.role}</p>
                         <p className="text-zinc-500 text-xs max-w-xs text-center mb-6 leading-relaxed hidden sm:block">{data.bio}</p>
                         <a href={`mailto:${data.contactEmail}`} className="px-5 py-2 bg-white/10 border border-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-8">Contact</a>
                         <ArrowDown className="text-zinc-600 animate-bounce" size={20} />
                     </motion.div>
                 </div>
             </motion.div>


             {/* --- Main Content Scroll Flow --- */}
             <div className="relative z-0">
                 {/* 1. Spacer: Forces the initial view to be just the Hero */}
                 <div className="h-[100vh] w-full" />

                 <div className="container mx-auto px-4 md:px-8 pb-32 lg:ml-[33.33%] lg:w-[66.66%] lg:pl-16">
                     
                     {/* 2. Showreel */}
                     {data.showreelLink && (
                         <section className="mb-32 scroll-mt-32" id="showreel">
                             <div className="flex items-center gap-4 mb-8">
                                 <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                 <span className="text-zinc-500 font-display font-bold text-xs tracking-[0.2em] uppercase">Showreel</span>
                             </div>
                             <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                         </section>
                     )}

                     {/* 3. My Works (Collage Grid) */}
                     {data.projects && data.projects.length > 0 && (
                         <section className="mb-32 scroll-mt-32" id="projects">
                             <div className="flex items-end justify-between border-b border-zinc-900 pb-6 mb-12">
                                <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter">Selected Works</h3>
                                <span className="text-zinc-600 text-xs font-bold tracking-widest hidden md:block">{data.projects.length} PROJECTS</span>
                             </div>
                             
                             {/* Collage Grid: grid-auto-flow: dense is key here */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-[250px] md:auto-rows-[300px]" style={{ gridAutoFlow: 'dense' }}>
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

                     {/* 4. Skills */}
                     {(data.tools?.length > 0 || data.primaryTool) && (
                         <section className="mb-32 scroll-mt-32" id="skills">
                             <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter mb-12">Arsenal</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 {/* Primary tool takes visual precedence */}
                                 {data.primaryTool && (
                                     <div className="col-span-2 md:col-span-2 aspect-[2/1] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-6 group relative overflow-hidden">
                                         <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                         <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 shadow-xl relative z-10">
                                             <ToolIcon name={data.primaryTool} className="w-8 h-8" />
                                         </div>
                                         <div className="relative z-10">
                                             <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider mb-1 block">Primary Weapon</span>
                                             <span className="text-xl font-bold text-white">{data.primaryTool}</span>
                                         </div>
                                     </div>
                                 )}
                                 
                                 {secondaryTools.map(tool => (
                                     <div key={tool} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square hover:bg-zinc-800/50 transition-colors">
                                         <ToolIcon name={tool} className="w-8 h-8 opacity-60" />
                                         <span className="text-xs font-medium text-zinc-400 text-center">{tool}</span>
                                     </div>
                                 ))}
                                 
                                 {data.aiTools?.map(tool => (
                                      <div key={tool} className="bg-zinc-900/30 border border-indigo-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square relative overflow-hidden group">
                                         <div className="absolute top-2 right-2 opacity-20"><Sparkles size={10} className="text-indigo-500"/></div>
                                         <ToolIcon name={tool} className="w-8 h-8 opacity-60 grayscale group-hover:grayscale-0 transition-all" />
                                         <span className="text-xs font-medium text-indigo-200/50 group-hover:text-indigo-200 transition-colors text-center">{tool}</span>
                                     </div>
                                 ))}
                             </div>
                         </section>
                     )}

                     {/* Footer */}
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