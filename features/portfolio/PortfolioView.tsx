import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { Mail, Instagram, Twitter, Linkedin, Youtube, Globe, X, Volume2, VolumeX, Loader2, MapPin, MonitorPlay, ArrowDown, Sparkles } from 'lucide-react';
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

// --- Showreel Player ---
const ShowreelPlayer: React.FC<{ src: string; thumbnail: string }> = React.memo(({ src, thumbnail }) => {
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    // Use a larger margin for loading to ensure it's ready before visible
    const isInView = useInView(containerRef, { margin: "200px 0px 0px 0px" }); 

    const type = React.useMemo(() => {
        if (!src) return 'none';
        const lower = src.toLowerCase();
        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
        if (lower.includes('vimeo.com')) return 'vimeo';
        if (lower.includes('drive.google.com')) return 'drive';
        if (lower.includes('dropbox.com') || lower.includes('dl.dropboxusercontent.com')) return 'dropbox';
        if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) return 'direct';
        return 'direct'; // Fallback for Firebase storage URLs
    }, [src]);

    const directSrc = type === 'dropbox' ? getDropboxDirectLink(src) || src : src;

    // Autoplay logic
    useEffect(() => {
        if (!isInView) return;
        
        // For direct videos, we can control playback
        const video = containerRef.current?.querySelector('video');
        if (video) {
            video.muted = true; // Ensure muted for autoplay
            video.play().catch(() => { /* Autoplay prevented */ });
        }
    }, [isInView]);

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
            // Drive preview with autoplay attempt
            const id = getDriveId(src);
            return `https://drive.google.com/file/d/${id}/preview?autoplay=1&muted=1`;
        }
        return src;
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl group"
        >
             {/* Thumbnail / Loading State */}
             <div className={`absolute inset-0 z-20 transition-opacity duration-1000 pointer-events-none bg-black ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}>
                {thumbnail && <img src={thumbnail} className="w-full h-full object-cover opacity-60" alt="Showreel" />}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                             <motion.div 
                                className="h-full bg-indigo-500" 
                                initial={{ width: "0%" }} 
                                animate={{ width: "100%" }} 
                                transition={{ duration: 1.5, repeat: Infinity }} 
                             />
                         </div>
                    </div>
                </div>
            </div>

            {/* Video Layer */}
            {type === 'direct' || type === 'dropbox' ? (
                <>
                    <video 
                        src={directSrc}
                        className="w-full h-full object-cover"
                        loop 
                        muted={isMuted} 
                        playsInline
                        onCanPlay={() => setIsVideoReady(true)}
                        onLoadedData={() => setIsVideoReady(true)}
                    />
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setIsMuted(!isMuted); 
                            const v = containerRef.current?.querySelector('video');
                            if(v) v.muted = !isMuted; 
                        }} 
                        className="absolute bottom-4 right-4 z-30 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                    >
                        {isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                    </button>
                </>
            ) : (
                <iframe 
                    src={isInView ? getEmbedSrc() : ''} 
                    className="w-full h-full pointer-events-none" // Disable interaction for background feel
                    allow="autoplay; fullscreen" 
                    onLoad={() => setTimeout(() => setIsVideoReady(true), 1000)}
                />
            )}
        </div>
    );
});

const CollageProjectCard: React.FC<{ project: Project; onClick: () => void }> = React.memo(({ project, onClick }) => {
    const isPortrait = project.aspectRatio === '9:16';
    let gridClass = "col-span-1 row-span-1";
    if (isPortrait) gridClass = "col-span-1 row-span-2";
    
    return (
        <motion.div 
            className={`relative group cursor-pointer bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 ${gridClass}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            onClick={onClick}
        >
            <div className="absolute inset-0 z-0">
                <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity z-10" />
            
            <div className="absolute bottom-0 left-0 w-full p-4 z-20">
                 {(project.contentType || project.category) && <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-1.5 block">{project.contentType || project.category}</span>}
                 <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{project.title}</h3>
            </div>
        </motion.div>
    )
});

const Lightbox: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    const driveEmbed = getDriveEmbedUrl(project.link);
    const dropboxDirect = getDropboxDirectLink(project.link);

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
    
    // TRANSITION LOGIC
    // The transition happens over the first 500px of scrolling.
    const TRANSITION_HEIGHT = 500;
    
    // --- DESKTOP ANIMATIONS ---
    const dContainerWidth = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["100%", "30%"]);
    const dPaddingLeft = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["0rem", "3rem"]); 
    const dAlign = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["center", "flex-start"]);
    const dJustify = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["center", "flex-start"]);
    const dTextAlign = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["center", "left"]);
    const dPaddingTop = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["0vh", "10vh"]);
    
    // Elements Scale/Fade
    const dAvatarSize = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["160px", "64px"]);
    const dNameSize = useTransform(scrollY, [0, TRANSITION_HEIGHT], ["4rem", "2rem"]); // font-size approx
    const dRoleOpacity = useTransform(scrollY, [0, TRANSITION_HEIGHT/2], [1, 0.8]);
    
    // --- MOBILE ANIMATIONS ---
    // On mobile, profile sticks to top as a bar
    const mHeight = useTransform(scrollY, [0, 300], ["100vh", "80px"]);
    const mBg = useTransform(scrollY, [200, 300], ["rgba(5,5,5,0)", "rgba(5,5,5,0.95)"]);
    const mBackdrop = useTransform(scrollY, [200, 300], ["blur(0px)", "blur(12px)"]);
    const mAvatarSize = useTransform(scrollY, [0, 300], [120, 32]);
    const mNameScale = useTransform(scrollY, [0, 300], [1, 0.6]); 
    const mDetailOpacity = useTransform(scrollY, [0, 150], [1, 0]); // Hide details quickly
    const mDetailDisplay = useTransform(scrollY, [0, 150], ["flex", "none"]);
    
    // --- CONTENT (SHOWREEL+) ANIMATIONS ---
    // Content fades in AFTER transition is mostly done
    const contentOpacity = useTransform(scrollY, [TRANSITION_HEIGHT - 100, TRANSITION_HEIGHT + 100], [0, 1]);
    const contentY = useTransform(scrollY, [TRANSITION_HEIGHT - 100, TRANSITION_HEIGHT + 100], [50, 0]);
    // The spacer pushes the content down so it appears "after" the profile shrinks
    const spacerHeight = TRANSITION_HEIGHT + 100;

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

             {/* --- DESKTOP PROFILE (FIXED) --- */}
             <motion.div 
                className="hidden lg:flex fixed left-0 top-0 h-full z-30 flex-col pointer-events-none"
                style={{ 
                    width: dContainerWidth, 
                    alignItems: dAlign, 
                    justifyContent: dJustify,
                    paddingLeft: dPaddingLeft,
                    paddingTop: dPaddingTop
                }}
             >
                 {/* Inner Content Container (Interactive) */}
                 <div className="pointer-events-auto flex flex-col transition-all duration-300 w-full px-8 max-w-xl">
                     <motion.div 
                        style={{ width: dAvatarSize, height: dAvatarSize }} 
                        className="rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 mb-6 shrink-0 shadow-2xl relative"
                     >
                        <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} />
                     </motion.div>
                     
                     <motion.div style={{ textAlign: dTextAlign, width: '100%' }}>
                         <motion.h1 style={{ fontSize: dNameSize }} className="font-display font-black tracking-tighter uppercase leading-[0.9] mb-3">{data.name}</motion.h1>
                         <motion.p style={{ opacity: dRoleOpacity }} className="text-xl text-zinc-400 font-medium tracking-tight mb-4">{data.role}</motion.p>
                         
                         {/* Details that persist in sidebar but might adjust alignment */}
                         <div className="space-y-4">
                            {data.location && (
                                <div className={`flex items-center gap-2 text-sm text-zinc-500 ${dTextAlign.get() === 'center' ? 'justify-center' : 'justify-start'}`}>
                                    <MapPin size={14} /> {data.location}
                                </div>
                            )}
                            <p className="text-zinc-500 text-sm leading-relaxed font-light max-w-sm">{data.bio}</p>
                            
                            <div className={`flex flex-wrap gap-4 mt-6 ${dTextAlign.get() === 'center' ? 'justify-center' : 'justify-start'}`}>
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
                 </div>
             </motion.div>

             {/* --- MOBILE PROFILE (STICKY HEADER) --- */}
             <motion.div 
                className="lg:hidden fixed top-0 w-full z-40 flex flex-col items-center justify-center overflow-hidden border-b border-zinc-800/0 pointer-events-none"
                style={{ height: mHeight, backgroundColor: mBg, backdropFilter: mBackdrop, borderColor: useTransform(scrollY, [200, 201], ["transparent", "#27272a"]) }}
             >
                 <div className="pointer-events-auto flex flex-col items-center p-4 w-full">
                     <div className="flex flex-col items-center w-full transition-all">
                        <motion.div style={{ width: mAvatarSize, height: mAvatarSize }} className="rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 mb-4 shadow-xl shrink-0">
                            <img src={data.profileImage} className="w-full h-full object-cover" />
                        </motion.div>
                        <motion.h1 style={{ scale: mNameScale }} className="font-display font-black tracking-tighter uppercase leading-none origin-center text-3xl">{data.name}</motion.h1>
                     </div>
                     
                     {/* Fading details for scroll */}
                     <motion.div style={{ opacity: mDetailOpacity, display: mDetailDisplay }} className="flex-col items-center mt-2 w-full">
                         <p className="text-zinc-400 text-sm mb-4">{data.role}</p>
                         {data.location && <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-4"><MapPin size={12}/>{data.location}</div>}
                         <p className="text-zinc-500 text-xs max-w-xs text-center mb-6 leading-relaxed hidden sm:block">{data.bio}</p>
                         
                         <div className="flex gap-3 mb-8">
                             <a href={`mailto:${data.contactEmail}`} className="px-5 py-2 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest">Contact</a>
                         </div>
                         <ArrowDown className="text-zinc-600 animate-bounce mt-4" size={20} />
                     </motion.div>
                 </div>
             </motion.div>


             {/* --- CONTENT SCROLL FLOW --- */}
             <div className="relative z-0 min-h-screen">
                 {/* 1. Spacer: Pushes content down to allow for the initial "Fullscreen" profile state */}
                 <div style={{ height: spacerHeight }} className="w-full" />

                 <motion.div 
                    style={{ opacity: contentOpacity, y: contentY }}
                    className="container mx-auto px-4 md:px-8 pb-32 lg:ml-[30%] lg:w-[70%] lg:pl-16 relative"
                 >
                     {/* 2. Showreel */}
                     {data.showreelLink && (
                         <section className="mb-24 scroll-mt-32 max-w-4xl" id="showreel">
                             <div className="flex items-center gap-3 mb-6">
                                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                 <span className="text-zinc-500 font-display font-bold text-[10px] tracking-[0.2em] uppercase">Showreel</span>
                             </div>
                             <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                         </section>
                     )}

                     {/* 3. My Works (Collage Grid) */}
                     {data.projects && data.projects.length > 0 && (
                         <section className="mb-32 scroll-mt-32" id="projects">
                             <div className="flex items-end justify-between border-b border-zinc-900 pb-6 mb-12">
                                <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter">Selected Works</h3>
                                <span className="text-zinc-600 text-[10px] font-bold tracking-widest hidden md:block">{data.projects.length} PROJECTS</span>
                             </div>
                             
                             {/* Dense Grid Layout */}
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

                     {/* 4. Arsenal / Skills */}
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
        </div>
    );
};