import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import screenfull from 'screenfull';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGoogleDriveId } from '@/lib/media-utils';

const Player = ReactPlayer as any;

interface VideoPlayerProps {
  url: string;
  thumbnail?: string;
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean; // Whether to show custom hover controls
  loop?: boolean;
  className?: string;
  onClick?: () => void;
}

const aspectClasses: Record<string, string> = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  thumbnail,
  aspectRatio = '16:9',
  autoplay = false,
  muted: initialMuted = true,
  controls = true,
  loop = true,
  className = '',
  onClick,
}) => {
  const [playing, setPlaying] = useState(autoplay);
  const [muted, setMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(initialMuted ? 0 : 1);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse GDrive URL to direct download stream to force native video tag
  const gdriveId = getGoogleDriveId(url);
  const processedUrl = gdriveId 
    ? `https://drive.google.com/uc?export=download&id=${gdriveId}`
    : url;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(screenfull.isFullscreen);
    };
    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
    }
    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', handleFullscreenChange);
      }
    };
  }, []);

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlaying(!playing);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(!muted);
    setVolume(!muted ? 0 : 1);
  };

  const handleToggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (screenfull.isEnabled && containerRef.current) {
      screenfull.toggle(containerRef.current);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setPlayed(val);
    if (playerRef.current) {
      playerRef.current.seekTo(val);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  if (!url) return null;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#0A0A0A] group ${
        !isFullscreen ? aspectClasses[aspectRatio] : 'w-full h-full'
      } ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick || handlePlayPause}
    >
      {/* Thumbnail overlay while loading */}
      <AnimatePresence>
        {!isReady && thumbnail && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 z-10"
          >
            <img
              src={thumbnail}
              alt="Video Thumbnail"
              className="w-full h-full object-cover filter blur-sm scale-105"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0A0A]">
          <AlertCircle size={24} className="text-zinc-600 mb-2" />
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Playback Error</p>
        </div>
      )}

      {/* Unified Player Core */}
      {!hasError && (
        <Player
          ref={playerRef}
          url={processedUrl}
          className="absolute inset-0 !w-full !h-full"
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          volume={volume}
          loop={loop}
          playsinline
          onReady={() => setIsReady(true)}
          onError={(e: any) => {
            console.error('VideoPlayer Error:', e);
            setHasError(true);
          }}
          onProgress={(state: any) => {
            setPlayed(state.played);
            setLoaded(state.loaded);
          }}
          onDuration={(d: number) => setDuration(d)}
          config={({
            youtube: {
              playerVars: { 
                controls: 0, 
                modestbranding: 1, 
                rel: 0, 
                showinfo: 0,
                iv_load_policy: 3 
              }
            },
            vimeo: {
              playerOptions: { 
                controls: false, 
                title: false, 
                byline: false, 
                portrait: false,
                background: !controls // If no controls allowed, use background mode
              }
            },
            file: {
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: true,
                style: { width: '100%', height: '100%', objectFit: 'cover' }
              }
            }
          }) as any}
        />
      )}

      {/* Custom Precision Minimal Controls */}
      {controls && !hasError && isReady && (
        <AnimatePresence>
          {(isHovering || !playing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Gradient */}
              <div className="w-full h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

              {/* Central Play/Pause Button */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button
                  onClick={handlePlayPause}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 transition-all pointer-events-auto"
                >
                  {playing ? (
                    <Pause size={24} className="fill-current" />
                  ) : (
                    <Play size={24} className="fill-current ml-1" />
                  )}
                </button>
              </div>

              {/* Bottom Controls Bar */}
              <div className="w-full px-4 pb-4 pt-12 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePlayPause}
                    className="text-white hover:text-white/80 transition-colors"
                  >
                    {playing ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  {/* Hairline Timeline */}
                  <div className="flex-1 group/slider relative h-1 flex items-center mx-2 cursor-pointer">
                    <input
                      type="range"
                      min={0}
                      max={0.999999}
                      step="any"
                      value={played}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden">
                      {/* Loaded buffer */}
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-white/30"
                        style={{ width: `${loaded * 100}%` }}
                      />
                      {/* Played progress */}
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-white"
                        style={{ width: `${played * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-white/70 text-[10px] font-mono tracking-widest hidden sm:block">
                    {formatTime(played * duration)} / {formatTime(duration)}
                  </div>

                  {/* Audio Toggle */}
                  <button 
                    onClick={handleToggleMute}
                    className="text-white hover:text-white/80 transition-colors ml-2"
                  >
                    {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Fullscreen Toggle */}
                  <button 
                    onClick={handleToggleFullscreen}
                    className="text-white hover:text-white/80 transition-colors"
                  >
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
