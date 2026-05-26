// ========================
// FRAMES MediaPlayer Component
// ========================
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaPlayerProps {
  url: string;
  thumbnailUrl?: string | null;
  aspectRatio?: string;
  autoPlay?: boolean;
}

const normalizeUrl = (url: string) => {
  if (!url) return '';
  // Convert Google Drive view links to direct download/stream links
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  return url;
};

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  url,
  thumbnailUrl,
  aspectRatio = '16:9',
  autoPlay = false,
}) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedUrl = normalizeUrl(url);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasStarted) setHasStarted(true);
    setPlaying(!playing);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const aspectStyles = aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-black group overflow-hidden ${aspectStyles}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={togglePlay}
    >
      {!hasStarted && thumbnailUrl && (
        <div className="absolute inset-0 z-10 cursor-pointer">
          <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white"
            >
              <Play size={28} className="ml-1" fill="currentColor" />
            </motion.div>
          </div>
        </div>
      )}

      {/* Player wrapper to ensure it fills the container */}
      <div className={`absolute inset-0 ${!hasStarted ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
        <ReactPlayer
          ref={playerRef}
          src={normalizedUrl}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          onTimeUpdate={handleTimeUpdate}
          controls={false} // We provide custom controls
          config={{
            youtube: { playerVars: { controls: 0, modestbranding: 1, rel: 0, showinfo: 0 } },
            vimeo: { playerOptions: { controls: false, byline: false, title: false } }
          } as any}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      {/* Custom Controls Overlay */}
      <AnimatePresence>
        {(isHovering || !playing) && hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20 flex flex-col justify-end"
          >
            {/* Click area to toggle play/pause */}
            <div className="flex-1 cursor-pointer" />
            
            <div className="px-4 pb-4 pt-8">
              {/* Progress bar */}
              <div className="w-full h-1 bg-white/30 rounded-full mb-4 overflow-hidden relative group/progress cursor-pointer">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-accent-gold transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="hover:text-accent-gold transition-colors">
                    {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="hover:text-accent-gold transition-colors">
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
                
                <button onClick={handleFullscreen} className="hover:text-accent-gold transition-colors">
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
