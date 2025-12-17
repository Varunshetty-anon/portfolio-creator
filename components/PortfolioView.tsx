import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { Mail, Instagram, Play, Twitter, Linkedin, Youtube, X, Volume2, VolumeX, Globe, Maximize2, Star, Sparkles, MonitorPlay } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { getBrandColor, getDriveEmbedUrl, EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '../utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

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

const ToolIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-6 h-6" }) => {
    const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
    const [imgSrc, setImgSrc] = useState(tool ? `https://cdn.simpleicons.org/${tool.slug}/white` : '');
    const [hasError, setHasError] = useState(false);
    const [useClearbit, setUseClearbit] = useState(false);

    useEffect(() => {
        if (tool) {
            setImgSrc(`https://cdn.simpleicons.org/${tool.slug}/white`);
            setHasError(false);
            setUseClearbit(false);
        }
    }, [name, tool]);

    const handleError = () => {
        if (!tool) { setHasError(true); return; }
        if (!useClearbit && tool.domain) {
            setUseClearbit(true);
            setImgSrc(`https://logo.clearbit.com/${tool.domain}`);
        } else {
            setHasError(true);
        }
    };

    if (!tool || hasError) {
        return <span className={`flex items-center justify-center font-bold text-zinc-500 text-[10px] uppercase border border-zinc-700 rounded bg-zinc-900 ${className}`}>{name ? name.charAt(0) : '?'}</span>;
    }

    return (
        <img src={imgSrc} alt={name} loading="lazy" className={`${className} object-contain ${useClearbit ? 'rounded-sm' : 'opacity-80'}`} onError={handleError} />
    );
};

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
};

const titleReveal = {
    initial: { y: 100, opacity: 0 },
    whileInView: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "circOut" } }
};

const IntroOverlay: React.FC<{ name: string; onComplete: () => void }> = ({ name, onComplete }) => {
    return (
        <motion.div 
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 2, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
        >
            <div className="overflow-hidden relative z-10">
                <motion.h1 
                    className="text-6xl md:text-9xl font-display font-black text-white tracking-tighter uppercase"
                    initial={{ y: 100, rotate: 5 }}
                    animate={{ y: 0, rotate: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {name.split(' ')[0] || "PORTFOLIO"}
                </motion.h1>
            </div>
            <motion.div className="absolute top-0 left-0 w-full h-full bg-black z-20" initial={{ y: 0 }} animate={{ y: '-100%' }} transition={{ duration: 1, delay: 2.2, ease: [0.76, 0, 0.24, 1] }} />
        </motion.div>
    )
}

const HeroContent: React.FC<{ data: PortfolioData; isMobile?: boolean }> = ({ data, isMobile = false }) => {
    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className={`space-y-8 origin-top ${isMobile ? 'py-8 flex flex-col items-center text-center' : ''}`}>
             <motion.div variants={fadeInUp} className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl relative mb-4">
                <img src={data.profileImage} className="w-full h-full object-cover" alt={data.name} loading="lazy" />
                <div className={`absolute bottom-4 right-4 w-5 h-5 rounded-full border-4 border-zinc-950 ${data.availability.status ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
            </motion.div>
            <div className="space-y-4">
                <motion.div variants={fadeInUp}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md ${data.availability.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <span className={`w-1 h-1 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>{data.availability.status ? 'Available for Work' : 'Unavailable'}
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tighter leading-[0.9] mb-3">{data.name || "YOUR NAME"}</h1>
                    <p className="text-lg md:text-2xl text-zinc-400 font-medium tracking-tight">{data.role || "Creative Director"}</p>
                </motion.div>
                <motion.p variants={fadeInUp} className="text-zinc-500 text-sm leading-relaxed max-w-md mx-auto xl:mx-0">{data.bio}</motion.p>
            </div>
            <motion.div variants={fadeInUp} className="pt-2 flex flex-wrap gap-3 justify-center xl:justify-start">
                <a href={`mailto:${data.contactEmail}`} className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-[11px] tracking-widest uppercase hover:scale-105 transition-transform shadow-2xl">
                    <Mail size={14} /> Contact Me
                </a>
                <div className="flex items-center gap-2">
                    {Object.entries(data.socials).map(([key, val]) => {
                        if (!val) return null;
                        const Icon = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, email: Mail }[key] || Globe;
                        return (
                            <a key={key} href={key === 'email' ? `mailto:${val}` : getSocialUrl(key, val as string)} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all hover:scale-110"><Icon size={16} /></a>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

const PrimaryToolCard: React.FC<{ toolName: string }> = ({ toolName }) => {
    if (!toolName) return null;
    const color = getBrandColor(toolName);
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative group col-span-2 md:col-span-1 overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/30 to-transparent opacity-50"></div>
            <div className="relative p-6 flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20"><Star size={8} fill="currentColor" /> Primary</div>
                <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-700 flex items-center justify-center shadow-2xl mb-1 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl" style={{ backgroundColor: color }}></div><ToolIcon name={toolName} className="w-8 h-8 relative z-10" />
                </div>
                <div><h4 className="text-white font-bold text-lg leading-tight">{toolName}</h4><p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Main Workflow</p></div>
            </div>
        </motion.div>
    );
};

const ShowreelPlayer: React.FC<{ src: string; thumbnail: string }> = ({ src, thumbnail }) => {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.3 });
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            if (isInView) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isInView]);

    return (
        <motion.div ref={containerRef} className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group" initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}>
            <div className="relative h-full w-full bg-black z-10">
                 {!hasError ? (
                     <video 
                        ref={videoRef} 
                        src={src} 
                        poster={thumbnail} 
                        className="w-full h-full object-cover" 
                        loop 
                        muted={isMuted} 
                        playsInline 
                        autoPlay 
                        preload="metadata"
                        onError={() => setHasError(true)} 
                     />
                 ) : (
                     <div className="w-full h-full relative">
                        <img src={thumbnail} className="w-full h-full object-cover opacity-60" alt="Showreel" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <a href={src} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white text-black text-xs font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-transform">
                                <Play size={14} fill="black" /> Watch Showreel
                            </a>
                        </div>
                     </div>
                 )}
                 {!hasError && (
                     <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all hover:scale-110">{isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
                     </div>
                 )}
                 {/* Blinking Red Dot on Top Left */}
                 <div className="absolute top-4 left-4 z-20 flex items-center">
                    <motion.div 
                        className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_8px_#dc2626]" 
                        animate={{ opacity: [1, 0.3, 1] }} 
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                 </div>
            </div>
        </motion.div>
    );
};

const AmbientProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    const isVideo = project.type === 'video';
    const isPortrait = project.aspectRatio === '9:16';
    return (
        <motion.div className={`relative group cursor-pointer w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-500 hover:scale-[1.01] shadow-2xl ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} onClick={onClick}>
            <div className="absolute inset-0"><img src={project.thumbnail} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt={project.title} loading="lazy" /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300"></div>
            <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end h-full">
                 <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-1 block">{project.category}</span>
                    <h3 className="text-xl md:text-2xl font-display font-bold text-white leading-tight mb-1">{project.title}</h3>
                    <p className="text-zinc-400 text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{project.description}</p>
                 </div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0 delay-100"><div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">{isVideo ? <Play size={16} fill="currentColor" /> : <Maximize2 size={16} />}</div></div>
        </motion.div>
    )
}

const Lightbox: React.FC<{ src: string; type: 'video' | 'image'; title: string; aspectRatio?: '16:9' | '9:16'; onClose: () => void }> = ({ src, type, title, aspectRatio, onClose }) => {
    const driveEmbed = getDriveEmbedUrl(src);
    const isPortrait = aspectRatio === '9:16';
    return (
        <motion.div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <button className="absolute top-4 right-4 p-3 bg-zinc-800/50 rounded-full hover:bg-zinc-700 transition-colors text-white z-50 group"><X size={20} className="group-hover:rotate-90 transition-transform"/></button>
            <motion.div className={`w-full ${isPortrait ? 'max-w-sm h-[80vh]' : 'max-w-6xl'} p-2 flex flex-col items-center relative`} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                {type === 'video' ? (
                     <div className={`w-full ${isPortrait ? 'h-full' : 'aspect-video'} rounded-2xl overflow-hidden shadow-2xl bg-black relative border border-zinc-800 z-10`}>
                        {driveEmbed ? (
                            <iframe src={driveEmbed} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : src.includes('youtube') || src.includes('vimeo') ? (
                            <iframe src={src} className="w-full h-full" allow="autoplay; fullscreen" />
                        ) : (
                            <video src={src} controls autoPlay preload="metadata" className="w-full h-full object-contain" playsInline />
                        )}
                     </div>
                ) : (
                    <img src={src} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl relative z-10" alt={title} loading="lazy" />
                )}
                <h2 className="mt-6 text-2xl font-display font-bold text-white text-center tracking-tight relative z-10">{title}</h2>
            </motion.div>
        </motion.div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showIntro, setShowIntro] = useState(!isPreview); 
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [150, 250], [0, 1]);
  const headerY = useTransform(scrollY, [150, 250], [-80, 0]);
  useEffect(() => { if (isPreview) setShowIntro(false); }, [isPreview]);
  const allTools = [...data.tools];
  if (data.primaryTool && !allTools.includes(data.primaryTool)) { allTools.unshift(data.primaryTool); }
  const secondaryTools = allTools.filter(t => t !== data.primaryTool);

  return (
    <div className="min-h-screen lg:h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30 lg:overflow-hidden relative">
      <AnimatePresence>
        {showIntro && <IntroOverlay name={data.name} onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"><div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/5 rounded-full blur-[150px] animate-pulse"></div><div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/5 rounded-full blur-[150px] animate-pulse delay-1000"></div></div>
      <motion.div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center px-6 justify-between pointer-events-none" style={{ opacity: headerOpacity, y: headerY }}><div className="flex items-center gap-3 pointer-events-auto"><img src={data.profileImage} className="w-8 h-8 rounded-full border border-zinc-800" alt="Profile" /><span className="font-display font-bold text-white text-sm tracking-wide">{data.name}</span></div><a href={`mailto:${data.contactEmail}`} className="p-2.5 bg-white text-black rounded-full pointer-events-auto shadow-lg"><Mail size={14}/></a></motion.div>
      <div className="lg:flex h-full relative z-10">
          <aside className="hidden xl:flex xl:w-[40%] xl:h-full xl:border-r border-zinc-900/50 bg-black/20 backdrop-blur-sm z-20 flex-col justify-center relative"><div className="p-12 xl:p-20 w-full h-full flex flex-col justify-center max-w-2xl mx-auto"><HeroContent data={data} isMobile={false} /></div></aside>
          <main className="w-full xl:w-[60%] h-auto xl:h-full xl:overflow-y-auto custom-scrollbar relative" ref={containerRef}>
             <div className="min-h-screen p-6 md:p-10 lg:p-16 xl:p-20 space-y-16 pb-32 max-w-5xl mx-auto pt-6 xl:pt-10">
                 <div className="xl:hidden"><HeroContent data={data} isMobile={true} /></div>
                  {data.showreelLink && (
                      <section className="space-y-6 mt-0">
                           <motion.div className="mb-4 text-center xl:text-left" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}><h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter uppercase leading-none">SHOWREEL</h2></motion.div>
                           <ShowreelPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                      </section>
                  )}
                  {data.projects.length > 0 && (
                      <section>
                          <motion.div className="flex items-end justify-between mb-8 border-b border-zinc-800 pb-6" variants={titleReveal} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: "-10%" }}><h2 className="text-5xl lg:text-7xl font-display font-black text-white tracking-tighter uppercase leading-none">MY<br/>WORKS</h2><div className="flex flex-col items-end"><span className="text-4xl font-display font-bold text-zinc-700">{data.projects.length}</span><span className="text-zinc-500 font-mono text-[9px] tracking-widest uppercase">Projects</span></div></motion.div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{data.projects.map(p => (<AmbientProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />))}</div>
                      </section>
                  )}
                  <section className="space-y-10 pt-4">
                      <motion.div className="flex items-center gap-3 mb-8 border-b border-zinc-900 pb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}><MonitorPlay size={20} className="text-indigo-400"/><h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">SKILLS</h2></motion.div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">{data.primaryTool && (<PrimaryToolCard toolName={data.primaryTool} />)}{secondaryTools.map(tool => (<motion.div key={tool} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center gap-2 p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:bg-zinc-900 hover:border-zinc-700 transition-all hover:scale-105"><ToolIcon name={tool} className="w-7 h-7 opacity-70" /><span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{tool}</span></motion.div>))}</div>
                      {data.aiTools.length > 0 && (<div className="pt-4"><div className="flex items-center gap-2 mb-4 text-zinc-500"><Sparkles size={14}/><h3 className="text-[10px] font-bold uppercase tracking-widest">AI Stack</h3></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{data.aiTools.map(tool => (<motion.div key={tool} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex items-center gap-2.5 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl hover:bg-indigo-500/10 transition-all"><ToolIcon name={tool} className="w-5 h-5" /><span className="text-[10px] font-medium text-indigo-300/60 uppercase">{tool}</span></motion.div>))}</div></div>)}
                  </section>
                  <footer className="pt-24 border-t border-zinc-900 text-center text-zinc-700 text-[9px] uppercase tracking-[0.25em]"><p>{data.name} &copy; {new Date().getFullYear()}</p><p className="mt-2 opacity-50">Built with Frames by Varun</p></footer>
             </div>
          </main>
      </div>
      <AnimatePresence>{selectedProject && (<Lightbox src={selectedProject.driveLink || selectedProject.link || selectedProject.thumbnail} type={selectedProject.type} title={selectedProject.title} aspectRatio={selectedProject.aspectRatio} onClose={() => setSelectedProject(null)}/>)}</AnimatePresence>
    </div>
  );
};