import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, ExternalLink, Play, Disc, Twitter, Linkedin, Youtube, Send, X, MessageSquare, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { PortfolioData, Project } from '../types';
import { Button } from './ui/Button';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

// --- Helper Functions ---
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// --- Custom Video Player for Direct Uploads ---
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
        // Attempt autoplay gently
        video.play().catch(() => setIsPlaying(false));
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
  
  // Hide controls logic
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

       {/* Big Center Play Button (only when paused) */}
       {!isPlaying && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl transform transition-transform group-hover:scale-110">
               <Play fill="white" className="ml-1 text-white w-8 h-8 opacity-90" />
            </div>
         </div>
       )}

       {/* Bottom Controls Bar */}
       <div 
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 flex flex-col gap-2 z-20 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
       >
         {/* Progress Bar */}
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
            <div className="w-3 h-3 bg-white rounded-full absolute pointer-events-none opacity-0 group-hover/progress:opacity-100 transition-opacity shadow" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}></div>
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
  // Simple heuristic for external embeds
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

  // Direct File / Blob / Base64 -> Use Custom Player
  return <CustomVideoPlayer src={src} thumbnail={thumbnail} />;
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Contact Form State
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    const subject = `Portfolio Inquiry from ${formState.name}`;
    const body = `Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`;
    window.location.href = `mailto:${data.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={`min-h-screen bg-black text-white selection:bg-zinc-800 ${isPreview ? 'pointer-events-none select-none' : ''}`}>
      
      {/* === Project Detail Modal === */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Video Area */}
              <div className="w-full md:w-2/3 aspect-video bg-black relative">
                {selectedProject.link ? (
                  <VideoPlayer src={selectedProject.link} thumbnail={selectedProject.thumbnail} />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-zinc-500 flex-col gap-2">
                      <Play size={40} className="opacity-20"/>
                      <span className="text-sm">No video source provided</span>
                   </div>
                )}
              </div>
              
              {/* Info Area */}
              <div className="w-full md:w-1/3 p-8 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                   <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-zinc-400 border border-zinc-800">
                     {selectedProject.category}
                   </span>
                   <button onClick={() => setSelectedProject(null)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                     <X size={24} />
                   </button>
                </div>
                
                <h2 className="text-2xl font-bold font-display mb-4 leading-tight">{selectedProject.title}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
                  {selectedProject.description || "No description available."}
                </p>

                <div className="mt-auto pt-6 border-t border-zinc-800">
                   <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Project Link</p>
                   {selectedProject.link && !selectedProject.link.startsWith('data:') ? (
                     <a href={selectedProject.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
                       <ExternalLink size={14} /> Open original source
                     </a>
                   ) : (
                     <span className="text-xs text-zinc-500">Direct Upload</span>
                   )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-screen">
        
        {/* === Left Sidebar (Profile) === */}
        <motion.aside 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-[400px] xl:w-[450px] lg:fixed lg:h-screen lg:overflow-y-auto p-6 lg:p-12 flex flex-col border-r border-zinc-900/50 bg-zinc-950/50 backdrop-blur-sm z-10"
        >
          <div className="flex-1 flex flex-col justify-center">
            {/* Profile Image */}
            <div className="mb-8 relative group">
              <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-full overflow-hidden border-2 border-zinc-800 ring-4 ring-black shadow-2xl mx-auto lg:mx-0">
                <img src={data.profileImage} alt={data.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out transform group-hover:scale-105" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full hidden lg:block">
                OPEN TO WORK
              </div>
            </div>

            {/* Name & Role */}
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-2 tracking-tight">
              {data.name}
            </h1>
            <p className="text-xl text-zinc-400 font-light mb-8 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-zinc-600 inline-block"></span>
              {data.role}
            </p>

            {/* Meta Info */}
            <div className="flex flex-col gap-3 text-sm text-zinc-500 mb-8 font-mono">
              <div className="flex items-center gap-3">
                <MapPin size={16} />
                <span>{data.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={16} />
                <span>{data.languages}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-8 relative">
               <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-700 to-transparent rounded-full opacity-50"></div>
               <p className="text-zinc-300 leading-relaxed text-lg italic pl-4">
                "{data.bio}"
               </p>
            </div>

            {/* Interactive Socials - Only display if linked */}
            <div className="flex flex-wrap gap-3 mt-auto">
              {data.socials.email && (
                <a href={`mailto:${data.socials.email}`} className="p-3 bg-zinc-900 rounded-full hover:bg-white hover:text-black transition-colors duration-300" title="Email">
                  <Mail size={20} />
                </a>
              )}
              {data.socials.instagram && (
                <a href={`https://instagram.com/${data.socials.instagram}`} target="_blank" rel="noreferrer" className="p-3 bg-zinc-900 rounded-full hover:bg-[#E1306C] hover:text-white transition-colors duration-300" title="Instagram">
                  <Instagram size={20} />
                </a>
              )}
              {data.socials.twitter && (
                <a href={`https://twitter.com/${data.socials.twitter}`} target="_blank" rel="noreferrer" className="p-3 bg-zinc-900 rounded-full hover:bg-sky-500 hover:text-white transition-colors duration-300" title="Twitter/X">
                  <Twitter size={20} />
                </a>
              )}
              {data.socials.youtube && (
                <a href={data.socials.youtube} target="_blank" rel="noreferrer" className="p-3 bg-zinc-900 rounded-full hover:bg-red-600 hover:text-white transition-colors duration-300" title="YouTube">
                  <Youtube size={20} />
                </a>
              )}
              {data.socials.linkedin && (
                <a href={data.socials.linkedin} target="_blank" rel="noreferrer" className="p-3 bg-zinc-900 rounded-full hover:bg-[#0077b5] hover:text-white transition-colors duration-300" title="LinkedIn">
                  <Linkedin size={20} />
                </a>
              )}
              {data.socials.discord && (
                 <div className="p-3 bg-zinc-900 rounded-full hover:bg-[#5865F2] hover:text-white transition-colors duration-300 cursor-help" title={`Discord: ${data.socials.discord}`}>
                   <Disc size={20} />
                 </div>
              )}
            </div>
          </div>
        </motion.aside>

        {/* === Right Content (Scrollable) === */}
        <div className="flex-1 lg:ml-[400px] xl:ml-[450px] p-6 lg:p-12 xl:p-16 space-y-20">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Showreel Section */}
            <motion.section variants={itemVariants} className="space-y-6">
              <h2 className="text-3xl font-display font-bold">Showreels</h2>
              <div className="relative aspect-video rounded-3xl overflow-hidden group bg-zinc-900 ring-1 ring-zinc-800">
                 {data.showreelLink ? (
                    <VideoPlayer src={data.showreelLink} thumbnail={data.showreelThumbnail} />
                 ) : (
                    <img src={data.showreelThumbnail} className="w-full h-full object-cover opacity-50"/>
                 )}
                 <div className="absolute bottom-6 left-6 pointer-events-none">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1 block">Featured Work</span>
                    <h3 className="text-xl font-bold">2024 Visual Anthology</h3>
                 </div>
              </div>
            </motion.section>

            {/* Editing Tools */}
            <motion.section variants={itemVariants} className="space-y-6 mt-16">
              <h2 className="text-3xl font-display font-bold">Editing Arsenal</h2>
              <div className="flex flex-wrap gap-3">
                {data.tools.map((tool, i) => (
                  <span key={i} className="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-medium hover:border-zinc-600 hover:text-white transition-colors cursor-default flex items-center gap-2">
                    {tool.includes('Premiere') && <span className="text-purple-500 font-bold text-xs bg-purple-500/10 px-1 rounded">Pr</span>}
                    {tool.includes('After') && <span className="text-blue-500 font-bold text-xs bg-blue-500/10 px-1 rounded">Ae</span>}
                    {tool}
                  </span>
                ))}
              </div>
            </motion.section>

            {/* AI Tools */}
             <motion.section variants={itemVariants} className="space-y-6 mt-12">
              <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                AI Integrations
                <span className="text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 py-0.5 rounded-md font-mono">NEXT GEN</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.aiTools.map((tool, i) => (
                  <div key={i} className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                     <span className="relative z-10 font-medium text-zinc-300 group-hover:text-white">{tool}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Testimonials Section */}
            {data.testimonials.length > 0 && (
              <motion.section variants={itemVariants} className="space-y-8 mt-20">
                 <h2 className="text-3xl font-display font-bold">Client Words</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.testimonials.map(t => (
                       <div key={t.id} className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl relative">
                          <div className="text-4xl text-zinc-700 font-serif absolute top-4 left-4">“</div>
                          <p className="text-zinc-300 italic mb-4 relative z-10 pt-4">{t.quote}</p>
                          <div>
                             <p className="font-bold text-white">{t.name}</p>
                             <p className="text-xs text-zinc-500 uppercase tracking-wider">{t.role}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </motion.section>
            )}

            {/* My Work / Gallery */}
            <motion.section variants={itemVariants} className="space-y-8 mt-20">
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-display font-bold">Selected Works</h2>
                <span className="text-zinc-500 font-mono text-sm hidden sm:block">CLICK TO VIEW</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.projects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => setSelectedProject(project)}
                    className="group relative rounded-2xl overflow-hidden bg-zinc-900 aspect-[4/5] md:aspect-[3/4] cursor-pointer ring-1 ring-zinc-800 hover:ring-zinc-500 transition-all"
                  >
                    <img src={project.thumbnail} alt={project.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300"></div>
                    
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                       <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30">
                          <Play fill="white" className="ml-1 text-white" />
                       </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs font-mono mb-2">{project.category}</span>
                      <h3 className="text-2xl font-bold leading-tight mb-2">{project.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Contact Form */}
            <motion.section variants={itemVariants} className="space-y-8 mt-24 pt-10 border-t border-zinc-900">
              <div className="max-w-xl">
                 <h2 className="text-3xl font-display font-bold mb-2">Get In Touch</h2>
                 <p className="text-zinc-400 mb-8">Have a project in mind? Let's create something cinematic together.</p>
                 
                 <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                       <input 
                         type="text" 
                         placeholder="Your Name" 
                         required
                         value={formState.name}
                         onChange={e => setFormState({...formState, name: e.target.value})}
                         className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-colors"
                       />
                    </div>
                    <div>
                       <input 
                         type="email" 
                         placeholder="Your Email" 
                         required
                         value={formState.email}
                         onChange={e => setFormState({...formState, email: e.target.value})}
                         className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-colors"
                       />
                    </div>
                    <div>
                       <textarea 
                         placeholder="Tell me about your project..." 
                         required
                         rows={4}
                         value={formState.message}
                         onChange={e => setFormState({...formState, message: e.target.value})}
                         className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                       ></textarea>
                    </div>
                    <Button type="submit" size="lg" className="w-full md:w-auto">
                       Send Message <Send size={16} className="ml-2"/>
                    </Button>
                 </form>
              </div>
            </motion.section>

            {/* Footer */}
            <motion.footer variants={itemVariants} className="pt-20 pb-10 border-t border-zinc-900 mt-20 text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} {data.name}. All rights reserved.</p>
                <div className="text-zinc-700 text-xs font-mono uppercase tracking-widest">
                  Made with CineFolio
                </div>
              </div>
            </motion.footer>

          </motion.div>
        </div>
      </div>
    </div>
  );
};