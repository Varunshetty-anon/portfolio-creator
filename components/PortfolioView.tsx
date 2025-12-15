import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, ExternalLink, Play, Disc, Twitter, Linkedin, Youtube, Send, X, Pause, Volume2, VolumeX, Maximize, Minimize, ArrowDown } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { Button } from './ui/Button';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

// --- Animation Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const fadeInUp = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

// --- Helper Functions ---
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// --- Custom Video Player (Direct Uploads) ---
const CustomVideoPlayer = ({ src, thumbnail }: { src: string, thumbnail?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const controlTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };
    const onLoadedMetadata = () => {
        setDuration(video.duration);
    };
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const manualChange = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (videoRef.current.duration / 100) * manualChange;
      setProgress(manualChange);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const handleMouseMove = () => {
      setShowControls(true);
      if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
      controlTimeoutRef.current = setTimeout(() => {
          if (isPlaying) setShowControls(false);
      }, 2000);
  };

  return (
     <div 
       ref={containerRef}
       className="relative w-full h-full bg-black group overflow-hidden select-none"
       onMouseMove={handleMouseMove}
       onMouseLeave={() => setShowControls(false)}
       onClick={togglePlay}
     >
       <video 
         ref={videoRef} 
         src={src} 
         poster={thumbnail} 
         className="w-full h-full object-contain cursor-pointer"
         playsInline
       />

       {!isPlaying && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl transform transition-transform group-hover:scale-110">
               <Play fill="white" className="ml-1 text-white w-8 h-8 opacity-90" />
            </div>
         </div>
       )}

       <div 
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 flex flex-col gap-2 z-20 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
       >
         <div className="relative w-full h-1 group/progress cursor-pointer flex items-center">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress} 
              onChange={handleSeek}
              className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div className="w-full h-1 bg-zinc-600/50 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
         </div>
         
         <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-4">
               <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors focus:outline-none">
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
               </button>
               
               <div className="flex items-center gap-2 group/vol">
                  <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors focus:outline-none">
                     {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={isMuted ? 0 : volume} 
                    onChange={handleVolumeChange}
                    className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none" 
                  />
               </div>

               <span className="text-xs font-mono text-zinc-300 select-none">
                  {formatTime(currentTime)} / {formatTime(duration)}
               </span>
            </div>

            <button onClick={toggleFullscreen} className="text-white hover:text-indigo-400 transition-colors focus:outline-none">
               {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
         </div>
       </div>
     </div>
  );
};

// --- Main Video Player Switcher ---
const VideoPlayer = ({ src, thumbnail }: { src: string, thumbnail?: string }) => {
  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  const isVimeo = src.includes('vimeo.com');

  if (isYouTube) {
    const videoId = src.includes('v=') ? src.split('v=')[1]?.split('&')[0] : src.split('/').pop();
    return (
      <iframe 
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`} 
        className="w-full h-full"
        allow="autoplay; encrypted-media" 
        allowFullScreen
      />
    );
  }

  if (isVimeo) {
    const videoId = src.split('/').pop();
    return (
      <iframe 
        src={`https://player.vimeo.com/video/${videoId}?autoplay=1`} 
        className="w-full h-full"
        allow="autoplay; fullscreen" 
        allowFullScreen
      />
    );
  }

  return <CustomVideoPlayer src={src} thumbnail={thumbnail} />;
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    const subject = `Portfolio Inquiry from ${formState.name}`;
    const body = `Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`;
    window.location.href = `mailto:${data.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={`min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans ${isPreview ? 'pointer-events-none select-none' : ''}`}>
      
      {/* Background Texture for Cinematic Feel */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="w-full md:w-3/4 aspect-video bg-black relative">
                {selectedProject.link ? (
                  <VideoPlayer src={selectedProject.link} thumbnail={selectedProject.thumbnail} />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <span className="text-sm">No source</span>
                   </div>
                )}
              </div>
              
              <div className="w-full md:w-1/4 p-6 md:p-8 flex flex-col bg-zinc-950/50 overflow-y-auto border-l border-zinc-800">
                <div className="flex justify-between items-start mb-6">
                   <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-[10px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800">
                     {selectedProject.category}
                   </span>
                   <button onClick={() => setSelectedProject(null)} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                     <X size={16} />
                   </button>
                </div>
                
                <h2 className="text-2xl font-bold font-display mb-4 leading-tight">{selectedProject.title}</h2>
                <div className="w-10 h-1 bg-indigo-500 mb-6 rounded-full"></div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1 whitespace-pre-wrap">
                  {selectedProject.description || "No description available."}
                </p>

                {selectedProject.link && !selectedProject.link.startsWith('data:') && !selectedProject.link.startsWith('blob:') && (
                   <a href={selectedProject.link} target="_blank" rel="noreferrer" className="mt-auto w-full py-3 border border-zinc-700 rounded-xl flex items-center justify-center gap-2 text-sm text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-all">
                      <ExternalLink size={14} /> Open Source
                   </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        
        {/* Header Grid (Bento Style) */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-20"
        >
           {/* 1. Profile Card (Large) */}
           <motion.div variants={fadeInUp} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent pointer-events-none"></div>
              
              <div className="flex items-start justify-between relative z-10">
                 <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700/50 shadow-lg">
                    <img src={data.profileImage} className="w-full h-full object-cover" alt="Profile"/>
                 </div>
                 <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/20 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Available
                 </div>
              </div>

              <div className="mt-8 relative z-10">
                 <h1 className="text-4xl lg:text-5xl font-display font-bold mb-2 tracking-tight leading-[0.9]">
                    {data.name}
                 </h1>
                 <p className="text-xl text-indigo-400 font-medium">{data.role}</p>
                 <p className="mt-4 text-zinc-400 text-sm max-w-md leading-relaxed">
                    {data.bio}
                 </p>
              </div>
           </motion.div>

           {/* 2. Stats/Location */}
           <motion.div variants={fadeInUp} className="col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-zinc-900/60 transition-colors">
              <MapPin className="text-zinc-600 mb-2 group-hover:text-indigo-400 transition-colors" />
              <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Based In</h3>
              <p className="text-xl font-bold">{data.location}</p>
           </motion.div>

           {/* 3. Languages */}
           <motion.div variants={fadeInUp} className="col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-zinc-900/60 transition-colors">
              <Globe className="text-zinc-600 mb-2 group-hover:text-indigo-400 transition-colors" />
              <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Languages</h3>
              <p className="text-lg font-bold leading-tight">{data.languages}</p>
           </motion.div>

           {/* 4. Social Dock */}
           <motion.div variants={fadeInUp} className="col-span-1 md:col-span-3 lg:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 flex items-center justify-between">
              <span className="text-zinc-500 text-xs uppercase tracking-widest hidden sm:block">Connect</span>
              <div className="flex gap-2 flex-wrap">
                 {Object.entries(data.socials).map(([key, value]) => {
                    if (!value || key === 'email') return null;
                    const icons: any = { instagram: Instagram, twitter: Twitter, youtube: Youtube, linkedin: Linkedin, discord: Disc };
                    const Icon = icons[key];
                    return (
                       <a key={key} href={key === 'discord' ? '#' : `https://${key}.com/${value}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:bg-white hover:text-black hover:scale-110 transition-all">
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

        {/* Showreel Section (Cinematic Width) */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
           className="mb-24"
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
                  <VideoPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
               ) : (
                  <img src={data.showreelThumbnail} className="w-full h-full object-cover opacity-50"/>
               )}
           </div>
        </motion.div>

        {/* Tools & Skills Marquee (Visual) */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-24"
        >
           <div className="flex flex-wrap justify-center gap-4 opacity-70">
              {[...data.tools, ...data.aiTools].map((tool, i) => (
                 <span key={i} className="px-6 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 text-sm font-medium hover:border-zinc-600 hover:text-white transition-colors cursor-default">
                    {tool}
                 </span>
              ))}
           </div>
        </motion.div>

        {/* Selected Works Grid */}
        <div className="mb-24">
           <h2 className="text-3xl font-display font-bold mb-10 px-2">Selected Works</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.projects.map((project, idx) => (
                 <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    onClick={() => setSelectedProject(project)}
                    className="group cursor-pointer"
                 >
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 mb-4 shadow-lg group-hover:shadow-indigo-500/10 transition-shadow">
                       <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                       <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                             <Play fill="white" className="ml-1 text-white" size={24} />
                          </div>
                       </div>
                    </div>
                    <div className="px-1">
                       <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{project.title}</h3>
                          <span className="text-[10px] font-mono border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 uppercase">{project.category}</span>
                       </div>
                       <p className="text-zinc-500 text-sm mt-2 line-clamp-2">{project.description}</p>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>

        {/* Testimonials */}
        {data.testimonials.length > 0 && (
           <div className="mb-24">
              <h2 className="text-3xl font-display font-bold mb-10 px-2 text-center">Endorsements</h2>
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

        {/* Contact Footer */}
        <footer className="border-t border-zinc-900 pt-20">
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-16 text-center max-w-4xl mx-auto">
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
           
           <div className="mt-20 flex justify-between items-center text-xs text-zinc-600 font-mono uppercase tracking-widest px-2">
              <p>Varun Shetty © 2024</p>
              <p>Powered by CineFolio</p>
           </div>
        </footer>

      </div>
    </div>
  );
};