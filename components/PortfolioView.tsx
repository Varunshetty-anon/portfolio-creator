import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, Play, Disc, Twitter, Linkedin, Youtube, X, Pause, Volume2, VolumeX, CheckCircle2, Laptop, Loader2, ExternalLink } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { Button } from './ui/Button';
import { getIconSlug, getBrandColor } from '../utils';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Animation Variants ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const fadeInUp: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const wordContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 }
    }
};

const letterVariant: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: "easeOut" } 
    }
};

const roleVariant: Variants = {
    hidden: { opacity: 0, x: -20, filter: 'blur(5px)' },
    visible: { 
      opacity: 1, 
      x: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.6, delay: 0.6, ease: "easeOut" } 
    }
};

// --- Helper Functions ---
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const isValidSocialLink = (url: string | undefined): boolean => {
    if (!url) return false;
    if (url.startsWith('http')) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    return url.length > 2;
};

const getSocialUrl = (platform: string, handle: string) => {
    if (!handle) return '#';
    if (handle.startsWith('http')) return handle;
    const cleanHandle = handle.replace(/^@/, '');
    
    switch(platform) {
        case 'instagram': return `https://instagram.com/${cleanHandle}`;
        case 'twitter': return `https://twitter.com/${cleanHandle}`;
        case 'youtube': return `https://youtube.com/${cleanHandle}`;
        case 'linkedin': return `https://linkedin.com/in/${cleanHandle}`;
        case 'discord': return '#'; 
        default: return handle;
    }
};

// --- Ambilight Glow ---
const AmbilightCanvas = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let animationFrameId: number;
        
        const loop = () => {
            if (videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    try {
                       ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                    } catch (e) {
                       // Suppress taint errors if crossOrigin fails
                    }
                }
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        
        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <canvas 
            ref={canvasRef}
            width={320} 
            height={180}
            className="absolute inset-0 w-full h-full filter blur-[60px] opacity-60 scale-125 z-0 pointer-events-none transition-opacity duration-1000 mix-blend-screen"
        />
    );
};


// --- Auto Play Video ---
const AutoPlayVideo = ({ src, thumbnail }: { src: string, thumbnail?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full h-full bg-black group rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop
        playsInline
        crossOrigin="anonymous"
        preload="auto"
      />
      <div className="absolute bottom-6 right-6 z-30">
          <button
            onClick={toggleMute}
            className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/10 shadow-lg"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
    </div>
  )
};

// --- Custom Video Player ---
const CustomVideoPlayer = ({ src, thumbnail, onClose }: { src: string, thumbnail?: string, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const controlTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto play on mount
    video.play().catch(e => console.log("Autoplay failed", e));

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    
    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onCanPlay = () => setIsBuffering(false);
    
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, [src]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); 
    const val = Number(e.target.value);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (videoRef.current.duration / 100) * val;
      setProgress(val);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
        const newMute = !isMuted;
        videoRef.current.muted = newMute;
        setIsMuted(newMute);
        // Sync volume state
        if (newMute) setVolume(0);
        else setVolume(1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const val = parseFloat(e.target.value);
      if (videoRef.current) {
          videoRef.current.volume = val;
          setVolume(val);
          setIsMuted(val === 0);
      }
  };

  const handleMouseMove = () => {
      setShowControls(true);
      if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
      controlTimeoutRef.current = setTimeout(() => {
          if (isPlaying) setShowControls(false);
      }, 2500); 
  };

  return (
     <div className="relative w-full h-full group z-50 flex items-center justify-center">
       
       <AmbilightCanvas videoRef={videoRef} />

       <div 
         ref={containerRef}
         className="relative w-full h-full bg-black overflow-hidden rounded-xl shadow-2xl border border-zinc-800 z-10 select-none"
         onMouseMove={handleMouseMove}
         onMouseLeave={() => setShowControls(false)}
         onClick={togglePlay}
       >
         <video 
           ref={videoRef} 
           src={src} 
           poster={thumbnail} 
           className="w-full h-full object-contain bg-black cursor-pointer"
           playsInline
           crossOrigin="anonymous"
           preload="auto"
           onClick={(e) => { e.stopPropagation(); togglePlay(); }}
         />

         <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100 duration-300"
         >
            <X size={24} />
         </button>

         {/* Buffering Indicator */}
         {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                <Loader2 size={48} className="text-white animate-spin drop-shadow-lg" />
            </div>
         )}

         {/* Play Overlay (Only when paused and NOT buffering) */}
         {!isPlaying && !isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 animate-in fade-in zoom-in duration-200">
                    <Play fill="white" className="ml-1 text-white opacity-90" size={40} />
                </div>
            </div>
         )}

         <div 
            className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 flex flex-col gap-4 z-40 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
         >
           <div className="relative w-full h-1.5 group/progress cursor-pointer flex items-center hover:h-2.5 transition-all duration-200">
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="0.1"
                value={progress} 
                onChange={handleSeek}
                onClick={(e) => e.stopPropagation()}
                className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
              />
              <div className="w-full h-full bg-zinc-700/60 rounded-full overflow-hidden backdrop-blur-sm">
                 <div className="h-full bg-indigo-500 rounded-full relative" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                  <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors focus:outline-none">
                     {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>

                  <div className="flex items-center gap-3 group/volume">
                      <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors focus:outline-none">
                         {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                      </button>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 h-1.5 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                      />
                  </div>
                  
                  <span className="text-sm font-mono text-zinc-300 select-none ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
              </div>
           </div>
         </div>
       </div>
     </div>
  );
};

// --- Main Video Player Switcher ---
const VideoPlayer = ({ src, thumbnail, onClose, aspectRatio }: { src: string, thumbnail?: string, onClose: () => void, aspectRatio?: string }) => {
  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  const isVimeo = src.includes('vimeo.com');

  if (isYouTube || isVimeo) {
    let embedSrc = src;
    if (isYouTube) {
        const videoId = src.includes('v=') ? src.split('v=')[1]?.split('&')[0] : src.split('/').pop();
        embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
    } else if (isVimeo) {
        const videoId = src.split('/').pop();
        embedSrc = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }

    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-black group z-50">
         <div className="absolute -inset-4 bg-indigo-600/30 blur-3xl -z-10 animate-pulse"></div>
         <iframe 
            src={embedSrc}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen" 
            allowFullScreen
         />
         <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-zinc-800 transition-colors"
         >
            <X size={24} />
         </button>
      </div>
    );
  }

  return <CustomVideoPlayer src={src} thumbnail={thumbnail} onClose={onClose} />;
};

// --- Tool Components ---
const ToolCard = ({ name, isMain = false }: { name: string, isMain?: boolean }) => {
    
    // Main Card: Dynamic Glow based on Brand Color
    if (isMain) {
        const slug = getIconSlug(name);
        const iconUrl = slug ? `https://cdn.simpleicons.org/${slug}/white` : null;
        const brandColor = getBrandColor(name);

        return (
            <div className="relative group">
                {/* ROTATING CONIC GLOW - DYNAMIC COLORS */}
                <div 
                    className="absolute -inset-1 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000"
                    style={{ background: `linear-gradient(to right, transparent, ${brandColor}50, transparent)` }}
                ></div>
                
                <div 
                    className="absolute -inset-[3px] rounded-[2rem] opacity-40 animate-spin-slow blur-xl"
                    style={{ 
                        background: `conic-gradient(from var(--angle), ${brandColor}, #ffffff 50%, ${brandColor})` 
                    }}
                ></div>

                <div className="w-full md:w-[28rem] h-64 bg-zinc-900 border border-zinc-700/50 rounded-3xl flex flex-col items-center justify-center gap-6 relative z-10 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50"></div>
                    {iconUrl ? (
                         <img src={iconUrl} className="w-24 h-24 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform duration-500 group-hover:scale-110" alt={name} />
                    ) : (
                         <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center">
                            <Laptop size={48} className="text-zinc-400" />
                         </div>
                    )}
                    <div className="text-center z-10">
                        <h3 className="text-3xl font-display font-bold text-white tracking-tight">{name}</h3>
                        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-1 block">Primary Workflow</span>
                    </div>
                </div>
            </div>
        )
    }

    // Secondary Cards: Text Only, Dynamic Colors, Floating
    // If exact color match exists, use it, else generate one
    const brandColor = getBrandColor(name);
    
    return (
        <div 
            className="px-5 py-2.5 w-auto rounded-xl border backdrop-blur-sm transition-all duration-300 group shadow-sm flex items-center justify-center hover:scale-105"
            style={{ 
                backgroundColor: `${brandColor}15`, 
                borderColor: `${brandColor}30`, 
                color: '#e4e4e7' // Light grey text for readability
            }}
        >
             {/* Small accent dot */}
             <span className="w-1.5 h-1.5 rounded-full mr-2 opacity-60" style={{ backgroundColor: brandColor }}></span>
            <span className="text-xs font-bold tracking-wide whitespace-nowrap">{name}</span>
        </div>
    )
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [discordCopied, setDiscordCopied] = useState(false);
  
  const handleDiscordClick = (handle: string) => {
      navigator.clipboard.writeText(handle);
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 2000);
  };

  const mainTool = data.primaryTool || data.tools[0];
  const softwareTools = data.tools.filter(t => t !== mainTool);
  const aiTools = data.aiTools;

  return (
    <div className={`min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans`}>
       <style>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .animate-spin-slow {
          animation: spin-glow 4s linear infinite;
        }
        @keyframes spin-glow {
          from { --angle: 0deg; }
          to   { --angle: 360deg; }
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-0 lg:py-20">
        
        {/* === MAIN LAYOUT WRAPPER === */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-16">

           {/* === LEFT COLUMN: STICKY PROFILE (Desktop) / STACKED (Mobile) === */}
           <aside className="lg:col-span-5 relative z-20">
              <div className="lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:justify-center py-12 lg:py-0">
                <motion.div 
                   variants={fadeInUp} 
                   initial="hidden"
                   animate="visible"
                   className="flex flex-col items-center lg:items-start text-center lg:text-left"
                 >
                    {/* AVATAR - Massive & Clean */}
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "backOut" }}
                        className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden border-2 border-zinc-800 shadow-2xl mb-8 bg-zinc-900"
                    >
                        <img 
                          src={data.profileImage} 
                          className="w-full h-full object-cover"
                          alt="Profile"
                        />
                    </motion.div>

                    {/* NAME - Huge Typography */}
                    <motion.h1 
                        variants={wordContainer}
                        initial="hidden"
                        animate="visible"
                        className="text-6xl lg:text-8xl font-display font-black tracking-tighter leading-[0.9] mb-4 text-white uppercase"
                    >
                        {data.name.split(" ").map((word, i) => (
                          <span key={i} className="block">
                             {Array.from(word).map((char, index) => (
                               <motion.span key={index} variants={letterVariant} className="inline-block">
                                 {char}
                               </motion.span>
                             ))}
                          </span>
                        ))}
                    </motion.h1>

                    {/* ROLE */}
                    <motion.p 
                        variants={roleVariant} 
                        initial="hidden" 
                        animate="visible" 
                        className="text-2xl text-indigo-500 font-medium font-display tracking-tight mb-6"
                    >
                        {data.role}
                    </motion.p>
                    
                    {/* BIO */}
                    <motion.p variants={fadeInUp} className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-md lg:max-w-none mx-auto lg:mx-0 mb-8">
                        {data.bio}
                    </motion.p>

                    {/* Availability Badge */}
                    <div className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border items-center gap-2 transition-colors ${data.availability.status ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        <span className={`w-2 h-2 rounded-full ${data.availability.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {data.availability.status ? 'Available for Work' : (
                            data.availability.link ? (
                                <a href={data.availability.link} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                    Currently Busy <ExternalLink size={10}/>
                                </a>
                            ) : 'Currently Busy'
                        )}
                    </div>
                 </motion.div>
              </div>
           </aside>

           {/* === RIGHT COLUMN: SCROLLABLE CONTENT === */}
           <main className="lg:col-span-7 pb-24 lg:py-20 space-y-24">
              
              {/* Info Cards (Grid) */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                  <motion.div variants={fadeInUp} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-zinc-900/60 transition-colors">
                      <MapPin className="text-zinc-600 mb-3 group-hover:text-indigo-400 transition-colors" />
                      <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Based In</h3>
                      <p className="text-xl font-bold">{data.location}</p>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-zinc-900/60 transition-colors">
                      <Globe className="text-zinc-600 mb-3 group-hover:text-indigo-400 transition-colors" />
                      <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Languages</h3>
                      <p className="text-lg font-bold leading-tight">{data.languages}</p>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="md:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 flex items-center justify-between">
                      <span className="text-zinc-500 text-xs uppercase tracking-widest hidden sm:block">Connect</span>
                      <div className="flex gap-2 flex-wrap justify-center md:justify-start w-full md:w-auto">
                        {Object.entries(data.socials).map(([key, value]) => {
                            if (!value || key === 'email') return null;
                            if (!isValidSocialLink(value as string)) return null;

                            const icons: any = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, discord: Disc };
                            const Icon = icons[key];
                            const url = getSocialUrl(key, value as string);
                            
                            if (key === 'discord') {
                                return (
                                  <button 
                                    key={key}
                                    onClick={() => handleDiscordClick(value as string)}
                                    className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:bg-[#5865F2] hover:text-white hover:scale-110 transition-all relative group"
                                    title="Click to copy Discord handle"
                                  >
                                    {discordCopied ? <CheckCircle2 size={18} /> : (Icon && <Icon size={18} />)}
                                  </button>
                                )
                            }

                            return (
                              <a 
                                  key={key} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className={`w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:scale-110 transition-all
                                    ${key === 'instagram' ? 'hover:bg-pink-600' : ''}
                                    ${key === 'twitter' ? 'hover:bg-blue-400' : ''}
                                    ${key === 'youtube' ? 'hover:bg-red-600' : ''}
                                    ${key === 'linkedin' ? 'hover:bg-blue-700' : ''}
                                  `}
                                >
                                  {Icon && <Icon size={18} />}
                              </a>
                            );
                        })}
                        <a href={`mailto:${data.socials.email}`} className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 hover:scale-110 transition-all shadow-lg shadow-indigo-500/20">
                            <Mail size={18} />
                        </a>
                      </div>
                  </motion.div>
              </motion.div>

              {/* Showreel Section */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                  <div className="flex items-end justify-between mb-6 px-2">
                      <h2 className="text-3xl font-display font-bold">Showreel</h2>
                      <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          Latest Cut
                      </div>
                  </div>
                  
                  <div className="relative aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
                      {data.showreelLink ? (
                          data.showreelLink.startsWith('blob:') ? (
                            <AutoPlayVideo src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                          ) : (
                            <AutoPlayVideo src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                          )
                      ) : (
                          <img src={data.showreelThumbnail} className="w-full h-full object-cover opacity-50"/>
                      )}
                  </div>
              </motion.div>

              {/* SKILLS SECTION (Formerly The Arsenal) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                  <div className="flex flex-col items-center justify-center text-center mb-8">
                      <h2 className="text-3xl font-display font-bold mb-8">SKILLS</h2>
                      
                      {/* Main Tool */}
                      {mainTool && (
                          <motion.div 
                              initial={{ scale: 0.9, opacity: 0 }}
                              whileInView={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.6 }}
                              className="mb-8"
                          >
                              <ToolCard name={mainTool} isMain={true} />
                          </motion.div>
                      )}
                  </div>

                  {/* Softwares Grid */}
                  {softwareTools.length > 0 && (
                      <div className="space-y-4 mb-4">
                          <div className="flex items-center gap-4 px-4 opacity-50 justify-center">
                              <div className="h-[1px] bg-zinc-800 w-24"></div>
                              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Other Softwares</span>
                              <div className="h-[1px] bg-zinc-800 w-24"></div>
                          </div>
                          
                          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto px-4">
                              {softwareTools.map((tool, i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ 
                                        duration: 4, 
                                        repeat: Infinity, 
                                        ease: "easeInOut",
                                        delay: i * 0.3 
                                    }}
                                  >
                                      <ToolCard name={tool} />
                                  </motion.div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* AI Tools Grid */}
                  {aiTools.length > 0 && (
                      <div className="space-y-4">
                          <div className="flex items-center gap-4 px-4 opacity-50 justify-center">
                              <div className="h-[1px] bg-zinc-800 w-24"></div>
                              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">AI Tools</span>
                              <div className="h-[1px] bg-zinc-800 w-24"></div>
                          </div>

                          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto px-4">
                              {aiTools.map((tool, i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ 
                                        duration: 5, 
                                        repeat: Infinity, 
                                        ease: "easeInOut",
                                        delay: (i + 1) * 0.3 
                                    }}
                                  >
                                      <ToolCard name={tool} />
                                  </motion.div>
                              ))}
                          </div>
                      </div>
                  )}
              </motion.div>

              {/* MY WORKS Grid (Formerly Selected Works) */}
              <div>
                  <h2 className="text-3xl font-display font-bold mb-10 px-2 uppercase">My Works</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      {data.projects.map((project, idx) => {
                        const isPortrait = project.aspectRatio === '9:16';
                        const aspectClass = isPortrait ? 'aspect-[9/16]' : 'aspect-video';

                        return (
                        <motion.div
                            key={project.id}
                            layoutId={`project-${project.id}`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`relative rounded-2xl hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 bg-zinc-900 border border-zinc-800 overflow-hidden group cursor-pointer transition-transform duration-300`}
                            onClick={() => setSelectedProject(project)}
                        >
                            <div className={`w-full ${aspectClass} relative`}>
                                <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                        <Play fill="white" className="ml-1 text-white" size={24} />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{project.title}</h3>
                                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{project.category}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        )
                      })}
                  </div>
              </div>

              {/* Endorsements */}
              {data.testimonials.length > 0 && (
                  <div>
                      <h2 className="text-3xl font-display font-bold mb-10 px-2 text-center uppercase">Endorsements</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.testimonials.map((t) => (
                            <div key={t.id} className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl relative">
                              <p className="text-lg text-zinc-300 italic mb-6">"{t.quote}"</p>
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
                                    {t.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white text-sm">{t.name}</p>
                                    <p className="text-xs text-zinc-500">{t.role}</p>
                                  </div>
                              </div>
                            </div>
                        ))}
                      </div>
                  </div>
              )}

              {/* Footer */}
              <footer className="border-t border-zinc-900 pt-16">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-16 text-center">
                      <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to collaborate?</h2>
                      <p className="text-zinc-400 mb-8 max-w-lg mx-auto">I'm currently available for freelance projects and long-term partnerships. Let's make something loud.</p>
                      
                      <div className="flex flex-col md:flex-row justify-center gap-4">
                        <button onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                            Start a Project
                        </button>
                        <a href={`mailto:${data.contactEmail}`} className="px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-white font-medium rounded-xl transition-colors">
                            {data.contactEmail}
                        </a>
                      </div>
                  </div>
                  
                  <div className="mt-16 flex justify-between items-center text-xs text-zinc-600 font-mono uppercase tracking-widest px-2">
                      <p>Varun Shetty © 2024</p>
                      <p>Powered by Frames</p>
                  </div>
              </footer>

           </main>
        </div>

      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-black/95 backdrop-blur-md"
                 onClick={() => setSelectedProject(null)}
              />
              <motion.div
                 layoutId={`project-${selectedProject.id}`}
                 className={`relative w-full max-h-full shadow-2xl overflow-visible z-10 flex items-center justify-center pointer-events-none`}
                 style={{
                     maxWidth: selectedProject.aspectRatio === '9:16' ? '50vh' : '1200px',
                     aspectRatio: selectedProject.aspectRatio === '9:16' ? '9/16' : '16/9'
                 }}
              >
                 <div className="w-full h-full pointer-events-auto">
                     <VideoPlayer 
                        src={selectedProject.link} 
                        thumbnail={selectedProject.thumbnail} 
                        onClose={() => setSelectedProject(null)}
                        aspectRatio={selectedProject.aspectRatio}
                     />
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};