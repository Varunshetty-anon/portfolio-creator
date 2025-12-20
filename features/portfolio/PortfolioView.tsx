import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
// Added ExternalLink to imports
import { Mail, Instagram, Twitter, Linkedin, Youtube, Globe, X, Volume2, VolumeX, Loader2, MapPin, MonitorPlay, ArrowDown, Sparkles, Play, ExternalLink } from 'lucide-react';
import { PortfolioData, Project } from '../../types';
import { getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST, trackPortfolioView, getDriveId, getDropboxDirectLink } from '../../lib/utils';

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

const ShowreelPlayer: React.FC<{ src: string; thumbnail: string }> = React.memo(({ src, thumbnail }) => {
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

    useEffect(() => {
        if (type !== 'direct' && type !== 'dropbox') return;
        const video = videoRef.current;
        if (!video) return;
        if (isInView) {
            video.muted = true;
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, [isInView, type]);

    const getEmbedSrc = () => {
         if (type === 'youtube') {
            const ytId = src.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
            return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0`;
        }
        if (type === 'vimeo') {
             const vId = src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/)?.[1];
             return `https://player.vimeo.com/video/${vId}?autoplay=1&muted=1&loop=1&background=1`;
        }
        if (type === 'drive') {
            const id = getDriveId(src);
            return `https://drive.google.com/file/d/${id}/preview?autoplay=1&muted=1&t=0`;
        }
        return src;
    };

    return (
        <div ref={containerRef} className="relative w-full rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-900 shadow-2xl group max-w-5xl mx-auto aspect-video">
             <div className={`absolute inset-0 z-20 bg-black transition-opacity duration-1000 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {thumbnail && <img src={thumbnail} className="w-full h-full object-cover opacity-40 blur-sm" alt="Showreel" />}
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-zinc-700" /></div>
            </div>

            {type === 'direct' || type === 'dropbox' ? (
                <div className="relative w-full h-full bg-black">
                    <video 
                        ref={videoRef} src={directSrc} className="w-full h-full object-contain" 
                        loop muted playsInline onLoadedData={() => setIsReady(true)}
                    />
                    <div className="absolute bottom-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                         <button onClick={() => { if(videoRef.current) { videoRef.current.muted = !videoRef.current.muted; setIsMuted(videoRef.current.muted); } }} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                            {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                        </button>
                    </div>
                </div>
            ) : (
                <iframe src={isInView ? getEmbedSrc() : ''} className="w-full h-full border-none" allow="autoplay; fullscreen" onLoad={() => setIsReady(true)} />
            )}
        </div>
    );
});

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = React.memo(({ project, onClick }) => (
    <motion.div 
        className="relative group cursor-pointer bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-900 aspect-video lg:aspect-[16/10] shadow-xl hover:shadow-indigo-500/10 transition-shadow"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
        onClick={onClick}
    >
        <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity z-10" />
        <div className="absolute bottom-0 left-0 w-full p-8 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-3 block">{project.contentType || project.category}</span>
             <h3 className="text-xl md:text-2xl font-display font-bold text-white leading-tight mb-2">{project.title}</h3>
             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                 {project.softwareUsed?.slice(0, 3).map(tool => <span key={tool} className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">{tool}</span>)}
             </div>
        </div>
        <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
             <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20"><Play size={16} fill="white" /></div>
        </div>
    </motion.div>
));

const Lightbox: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => (
    <motion.div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <button className="absolute top-6 right-6 p-4 text-zinc-400 hover:text-white transition-all z-[2100] hover:rotate-90"><X size={32} /></button>
        <motion.div className="relative bg-[#09090b] border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row max-w-7xl w-full h-[85vh]" initial={{ scale: 0.9, y: 60, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 60, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
                {project.type === 'video' ? (
                    <iframe src={project.link.includes('drive.google') ? getDriveEmbedUrl(project.link)! : project.link} className="w-full h-full border-none" allow="autoplay; fullscreen" />
                ) : (
                    <img src={project.link || project.thumbnail} className="w-full h-full object-contain p-4" />
                )}
            </div>
            <div className="w-full lg:w-[400px] bg-[#09090b] p-10 flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-900 overflow-y-auto custom-scrollbar">
                <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 block">{project.contentType}</span>
                <h2 className="text-4xl font-display font-bold text-white mb-6 tracking-tighter leading-[0.9]">{project.title}</h2>
                <p className="text-zinc-400 text-lg leading-relaxed mb-10 font-light">{project.description}</p>
                {project.softwareUsed && (
                    <div className="mt-auto">
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Production Tools</h4>
                        <div className="flex flex-wrap gap-2">
                            {project.softwareUsed.map(t => <span key={t} className="px-4 py-2 bg-zinc-900 rounded-xl text-xs text-zinc-300 font-bold tracking-tight hover:bg-zinc-800 transition-colors">{t}</span>)}
                        </div>
                    </div>
                )}
                <a href={project.link} target="_blank" rel="noreferrer" className="mt-10 flex items-center justify-center gap-3 w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all group">
                    View Project <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
            </div>
        </motion.div>
    </motion.div>
);

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const { scrollY } = useScroll();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile(); window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const DESKTOP_TRANSITION = 700;
    const MOBILE_TRANSITION = 450;
    const TRANSITION_END = isMobile ? MOBILE_TRANSITION : DESKTOP_TRANSITION;

    // DESKTOP TRANSFORMS
    const dWidth = useTransform(scrollY, [0, DESKTOP_TRANSITION], ["100%", "36%"]);
    const dPaddingLeft = useTransform(scrollY, [0, DESKTOP_TRANSITION], ["50vw", "4.5rem"]);
    const dTranslateX = useTransform(scrollY, [0, DESKTOP_TRANSITION], ["-50%", "0%"]);
    const dAvatarSize = useTransform(scrollY, [0, DESKTOP_TRANSITION], [340, 110]);
    const dNameSize = useTransform(scrollY, [0, DESKTOP_TRANSITION], ["9rem", "2.8rem"]);
    const dBioOpacity = useTransform(scrollY, [0, DESKTOP_TRANSITION * 0.3], [1, 1]); // Bio stays visible but moves

    // MOBILE TRANSFORMS
    const mHeight = useTransform(scrollY, [0, MOBILE_TRANSITION], ["100vh", "85px"]);
    const mBg = useTransform(scrollY, [MOBILE_TRANSITION - 80, MOBILE_TRANSITION], ["rgba(5,5,5,0)", "rgba(5,5,5,0.98)"]);
    const mBlur = useTransform(scrollY, [MOBILE_TRANSITION - 80, MOBILE_TRANSITION], ["blur(0px)", "blur(24px)"]);
    const mAvatarSize = useTransform(scrollY, [0, MOBILE_TRANSITION], [180, 42]);
    const mNameSize = useTransform(scrollY, [0, MOBILE_TRANSITION], ["3rem", "1.2rem"]);
    const mDetailsAlpha = useTransform(scrollY, [0, MOBILE_TRANSITION * 0.4], [1, 0]);

    // CONTENT REVEAL
    const cAlpha = useTransform(scrollY, [TRANSITION_END * 0.8, TRANSITION_END + 50], [0, 1]);
    const cY = useTransform(scrollY, [TRANSITION_END * 0.8, TRANSITION_END + 50], [80, 0]);

    useEffect(() => {
        if (!isPreview && data.uid) trackPortfolioView(data.uid);
        document.body.style.overflow = selectedProject ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; }
    }, [data.uid, isPreview, selectedProject]);

    if (!data) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-zinc-800" /></div>;

    const displayName = data.name || "VARUN SHETTY";
    const nameParts = displayName.split(' ');

    return (
        <div className="bg-[#050505] min-h-screen w-full relative text-zinc-100 font-sans selection:bg-indigo-500/40">
             <AnimatePresence>{selectedProject && <Lightbox project={selectedProject} onClose={() => setSelectedProject(null)} />}</AnimatePresence>

             <div style={{ height: TRANSITION_END + 200 }} className="w-full pointer-events-none" />

             <motion.div 
                className="fixed top-0 left-0 z-[100] flex flex-col pointer-events-none w-full"
                style={isMobile ? {
                    height: mHeight, backgroundColor: mBg, backdropFilter: mBlur,
                    borderBottom: useTransform(scrollY, [MOBILE_TRANSITION - 1, MOBILE_TRANSITION], ["1px solid transparent", "1px solid #1a1a1e"]),
                    justifyContent: 'center', alignItems: 'center'
                } : {
                    width: dWidth, height: '100vh', paddingLeft: dPaddingLeft,
                    justifyContent: 'center', alignItems: 'flex-start'
                }}
             >
                 <motion.div 
                    className={`pointer-events-auto flex w-full max-w-2xl px-8 ${isMobile ? 'flex-row items-center justify-center gap-5' : 'flex-col items-start'}`}
                    style={!isMobile ? { x: dTranslateX } : {}}
                 >
                     <motion.div 
                        style={{ width: isMobile ? mAvatarSize : dAvatarSize, height: isMobile ? mAvatarSize : dAvatarSize }} 
                        className="rounded-full overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative"
                        layout
                     >
                        <img src={data.profileImage} className="w-full h-full object-cover" alt={displayName} />
                     </motion.div>

                     <div className={`flex flex-col ${isMobile ? 'items-start min-w-0' : 'items-start mt-12 w-full'}`}>
                         <motion.h1 
                            style={{ fontSize: isMobile ? mNameSize : dNameSize }} 
                            className="font-display font-black tracking-tighter uppercase leading-[0.85] text-white flex flex-col whitespace-nowrap"
                         >
                            {isMobile ? displayName : (
                                <>
                                    <span>{nameParts[0]}</span>
                                    {nameParts[1] && <span className="opacity-40">{nameParts[1]}</span>}
                                </>
                            )}
                         </motion.h1>

                         <motion.div 
                            style={{ opacity: isMobile ? mDetailsAlpha : 1 }}
                            className={`${isMobile ? 'hidden' : 'block'} w-full mt-10 space-y-8`}
                         >
                            <div>
                                <p className="text-2xl md:text-3xl text-zinc-500 font-bold tracking-tight mb-2">{data.role}</p>
                                <div className="flex items-center gap-3 text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
                                    <MapPin size={12} className="text-indigo-500"/> {data.location || 'Remote'}
                                </div>
                            </div>
                            
                            <p className="text-zinc-400 text-lg leading-relaxed font-light max-w-md border-l-2 border-zinc-900 pl-6 py-2">{data.bio}</p>
                            
                            <div className="flex flex-wrap gap-5 pt-8">
                                <a href={`mailto:${data.contactEmail}`} className="px-12 py-5 bg-white text-black rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all hover:-translate-y-1 shadow-2xl shadow-white/5">Get in Touch</a>
                                <div className="flex gap-2">
                                    {Object.entries(data.socials).map(([key, val]) => {
                                        if (!val) return null;
                                        const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                        return (
                                            <a key={key} href={getSocialUrl(key, val as string)} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-3xl border border-zinc-900 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-900 hover:border-zinc-800 transition-all">
                                                <Icon size={22} />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                         </motion.div>
                     </div>
                 </motion.div>

                 {isMobile && (
                     <motion.div style={{ opacity: mDetailsAlpha }} className="absolute bottom-20 flex flex-col items-center gap-6">
                        <span className="text-[10px] font-black tracking-[0.8em] text-zinc-700 uppercase">Explore</span>
                        <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="text-zinc-800"><ArrowDown size={24} /></motion.div>
                     </motion.div>
                 )}
             </motion.div>

             <motion.div 
                className={`relative z-10 container mx-auto px-6 md:px-12 pb-48 ${isMobile ? 'pt-24' : 'lg:ml-[36vw] lg:w-[64vw] lg:pl-28'}`}
                style={{ opacity: cAlpha, y: cY }}
             >
                 {data.showreelLink && (
                     <section className="mb-48" id="showreel">
                         <div className="flex items-center gap-6 mb-12">
                             <span className="text-zinc-800 font-display font-black text-[11px] tracking-[0.6em] uppercase whitespace-nowrap">Showreel // Feature</span>
                             <div className="h-px w-full bg-zinc-900/50" />
                         </div>
                         <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                     </section>
                 )}

                 {data.projects && data.projects.length > 0 && (
                     <section className="mb-48" id="works">
                         <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-900/50 pb-12 mb-20 gap-8">
                            <div>
                                <h3 className="text-6xl md:text-9xl font-display font-black text-white uppercase tracking-tighter leading-[0.85] mb-4">Works</h3>
                                <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-xs">A selection of visual stories</p>
                            </div>
                            <span className="text-indigo-500 font-black text-3xl font-display">/{data.projects.length}</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                             {data.projects.map((project) => (
                                 <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
                             ))}
                         </div>
                     </section>
                 )}

                 <section className="mb-48" id="arsenal">
                    <div className="flex items-center gap-6 mb-16">
                         <div className="h-px w-full bg-zinc-900/50" />
                         <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-4 shrink-0">
                            <Sparkles size={24} className="text-indigo-500"/> Creative Arsenal
                        </h3>
                        <div className="h-px w-full bg-zinc-900/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...(data.tools || []), ...(data.aiTools || [])].map((tool, i) => (
                            <motion.div 
                                key={tool} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                                className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-6 aspect-square hover:bg-zinc-900/40 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ToolIcon name={tool} className="w-14 h-14" />
                                <span className="text-[10px] font-black text-zinc-700 group-hover:text-white uppercase tracking-[0.4em] text-center transition-colors">{tool}</span>
                            </motion.div>
                        ))}
                    </div>
                 </section>

                 <footer className="pt-32 border-t border-zinc-900/50">
                     <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-24">
                        <div className="max-w-2xl">
                            <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter mb-10 leading-[0.85] text-white">Let's create<br/>the future.</h2>
                            <a href={`mailto:${data.contactEmail}`} className="text-2xl md:text-4xl text-zinc-600 hover:text-indigo-500 transition-all font-light tracking-tight block pb-4 border-b border-zinc-900">
                                {data.contactEmail}
                            </a>
                        </div>
                        <div className="text-zinc-800 text-[10px] font-black uppercase tracking-[0.6em] flex flex-col items-start lg:items-end gap-6 w-full lg:w-auto">
                             <div className="flex gap-6 mb-2 lg:hidden">
                                {Object.entries(data.socials).map(([key, val]) => {
                                    if (!val) return null;
                                    const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                                    return <Icon key={key} size={20} className="text-zinc-800 hover:text-indigo-500 transition-colors cursor-pointer" />
                                })}
                             </div>
                             <div className="space-y-2 text-right">
                                <p>© {new Date().getFullYear()} {data.name}</p>
                                <p className="text-indigo-950">Frames Collective</p>
                             </div>
                        </div>
                     </div>
                 </footer>
             </motion.div>
        </div>
    );
};
