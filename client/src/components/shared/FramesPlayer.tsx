import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGoogleDriveId } from '@/lib/media-utils';

const Player = ReactPlayer as any;

interface FramesPlayerProps {
  url: string;
  thumbnail?: string;
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean; // Whether to show custom hover controls
  loop?: boolean;
  className?: string;
  onClick?: () => void;
  onTheatreToggle?: () => void;
  isTheatre?: boolean;
  onReady?: () => void;
  minimalMode?: boolean; // If true, disables play/pause interactions and scrubber, only shows mute toggle
}

const aspectClasses: Record<string, string> = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
};

export const FramesPlayer: React.FC<FramesPlayerProps> = ({
  url,
  thumbnail,
  aspectRatio = '16:9',
  autoplay = false,
  muted: initialMuted = true,
  controls = true,
  loop = true,
  className = '',
  onClick,
  onTheatreToggle,
  isTheatre = false,
  onReady,
  minimalMode = false,
}) => {
  const [playing, setPlaying] = useState(autoplay);
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('frames_player_muted');
      if (saved !== null) return JSON.parse(saved);
    }
    return initialMuted;
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('frames_player_volume');
      if (saved !== null) return parseFloat(saved);
    }
    return initialMuted ? 0 : 1;
  });
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; clientX: number }>({ time: 0, clientX: 0 });
  const hasAutoplayStarted = useRef(false);

  const getCurrentTime = useCallback(() => {
    const player = playerRef.current;
    if (!player) return 0;
    if (typeof player.getCurrentTime === 'function') return player.getCurrentTime() || 0;
    return player.currentTime || 0;
  }, []);

  const seekTo = useCallback((time: number) => {
    const player = playerRef.current;
    if (!player) return;
    if (typeof player.seekTo === 'function') {
      player.seekTo(time, 'seconds');
      return;
    }
    player.currentTime = Math.max(time, 0);
  }, []);

  // Persist volume settings
  useEffect(() => {
    localStorage.setItem('frames_player_muted', JSON.stringify(muted));
  }, [muted]);

  useEffect(() => {
    localStorage.setItem('frames_player_volume', volume.toString());
  }, [volume]);

  const gdriveId = getGoogleDriveId(url);

  // We route all Google Drive videos through our smart backend proxy.
  // The backend will dynamically serve a direct CDN redirect for Desktop (maximum speed)
  // and a piped stream for Mobile (to bypass Safari third-party cookie blocks).
  const processedUrl = gdriveId ? `/api/v1/portfolio/drive-proxy/${gdriveId}` : url;


  // --- FULLSCREEN HANDLING ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error attempting to toggle fullscreen:', err);
    }
  }, []);

  // --- CONTROLS IDLE LOGIC ---
  const showControls = useCallback(() => {
    setIsHovering(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    // Only auto-hide if playing
    if (playing) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isScrubbing) setIsHovering(false);
      }, 2500);
    }
  }, [playing, isScrubbing]);

  const handleMouseMove = useCallback(() => {
    showControls();
  }, [showControls]);

  const handleMouseLeave = useCallback(() => {
    if (minimalMode) return;
    if (playing && !isScrubbing) {
      setIsHovering(false);
    }
  }, [playing, isScrubbing, minimalMode]);

  useEffect(() => {
    if (minimalMode) return;
    if (!playing) {
      setIsHovering(true); // Always show controls when paused
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    } else {
      showControls();
    }
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [playing, showControls, minimalMode]);

  // --- KEYBOARD ACCESSIBILITY ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle global keys if fullscreen, otherwise only if the container has focus
    const isFocused = document.activeElement === containerRef.current || containerRef.current?.contains(document.activeElement);
    if (!isFullscreen && !isFocused) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        setPlaying(p => !p);
        showControls();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (playerRef.current) {
          const current = getCurrentTime();
          seekTo(current + 5);
          showControls();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (playerRef.current) {
          const current = getCurrentTime();
          seekTo(current - 5);
          showControls();
        }
        break;
      case 'm':
        e.preventDefault();
        setMuted((m: boolean) => !m);
        setVolume((v: number) => v === 0 ? 1 : 0);
        showControls();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  }, [getCurrentTime, isFullscreen, seekTo, showControls, toggleFullscreen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // --- ACTIONS ---
  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isReady && !playing) {
      hasAutoplayStarted.current = true;
      return;
    }
    setPlaying(p => !p);
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMuted((m: boolean) => !m);
    setVolume(muted ? 1 : 0);
  };

  const handleSeekMouseDown = () => setIsScrubbing(true);
  
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setPlayed(val);
  };

  const handleSeekMouseUp = (e: React.SyntheticEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setIsScrubbing(false);
    if (playerRef.current) {
      const val = parseFloat(e.currentTarget.value);
      seekTo(val * duration);
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
    <>
      {minimalMode && (
        <style>{`
          .frames-player-minimal video {
            object-fit: cover !important;
          }
          .frames-player-minimal iframe {
            pointer-events: none !important;
            transform: scale(1.05); /* hide iframe borders if any */
          }
        `}</style>
      )}
      <div
        ref={containerRef}
        className={`relative overflow-hidden bg-black group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
          !isFullscreen ? aspectClasses[aspectRatio] : 'w-full h-full'
        } ${className} ${minimalMode ? 'frames-player-minimal' : ''}`}
      onMouseMove={minimalMode ? undefined : handleMouseMove}
      onMouseLeave={minimalMode ? undefined : handleMouseLeave}
      onClick={(e) => {
        if (minimalMode) {
          handleToggleMute(e);
          return;
        }
        if (onClick) {
          onClick();
          return;
        }

        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current.time;
        
        // Double-tap detection for mobile
        if (timeSinceLastTap < 300 && window.innerWidth < 768) {
          if (containerRef.current && playerRef.current) {
            const { left, width } = containerRef.current.getBoundingClientRect();
            const clickX = e.clientX - left;
            const current = getCurrentTime();
            
            if (clickX < width / 2) {
              seekTo(Math.max(current - 10, 0));
            } else {
              seekTo(current + 10);
            }
            showControls();
          }
          lastTapRef.current.time = 0; // Reset tap tracker
        } else {
          lastTapRef.current = { time: now, clientX: e.clientX };
          // Mobile single tap toggles controls, desktop clicking pauses
          if (window.innerWidth < 768) {
            if (isHovering && playing) setIsHovering(false);
            else showControls();
          } else {
            handlePlayPause(e);
          }
        }
      }}
      tabIndex={0}
      role="region"
      aria-label="Video Player"
    >
      {/* Thumbnail Overlay */}
      <AnimatePresence>
        {!isReady && thumbnail && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 z-10 bg-black"
          >
            <img
              src={thumbnail}
              alt="Video Thumbnail"
              className="w-full h-full object-cover opacity-60 scale-105 blur-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isBuffering && !hasError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            {/* Branded minimalistic frame loader */}
            <motion.div 
              animate={{ rotate: 90 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 border-[1.5px] border-white/70 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950">
          <AlertCircle className="w-8 h-8 text-zinc-600 mb-3" />
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Media Unavailable</p>
        </div>
      )}

      {/* React Player Core */}
      {!hasError && (
        <Player
          src={processedUrl}
          playing={playing}
          muted={muted}
          volume={volume}
          controls={false}
          loop={loop}
          width="100%"
          height="100%"
          playsInline={true}
          config={{
            file: {
              forceVideo: gdriveId ? true : undefined,
              attributes: {
                controlsList: 'nodownload',
                playsInline: true
              }
            },
            youtube: {
              playerVars: {
                controls: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                playsinline: 1,
              }
            },
            vimeo: {
              playerOptions: {
                controls: false,
                byline: false,
                portrait: false,
                title: false,
                dnt: true,
                playsinline: true,
                background: true,
                muted: muted,
              }
            }
          }}
          onReady={() => {
            setIsReady(true);
            if (hasAutoplayStarted.current) {
              setPlaying(true);
              hasAutoplayStarted.current = false;
            }
            if (onReady) onReady();
          }}
          onTimeUpdate={(event: React.SyntheticEvent<HTMLVideoElement>) => {
            const media = event.currentTarget;
            if (!isScrubbing && media.duration) {
              setPlayed(media.currentTime / media.duration);
            }
          }}
          onProgress={(event: React.SyntheticEvent<HTMLVideoElement>) => {
            const media = event.currentTarget;
            if (media.buffered.length && media.duration) {
              const end = media.buffered.end(media.buffered.length - 1);
              setLoaded(Math.min(end / media.duration, 1));
            }
          }}
          onDurationChange={(event: React.SyntheticEvent<HTMLVideoElement>) => {
            setDuration(event.currentTarget.duration || 0);
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onError={(err: any) => {
            console.warn('FramesPlayer Error:', err);
            setHasError(true);
          }}
          ref={playerRef}
        />
      )}

      {/* Minimal Mode Persistent Mute Button */}
      {minimalMode && !hasError && isReady && (
        <div className="absolute bottom-4 right-4 z-40">
          <button 
            onClick={handleToggleMute}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors focus:outline-none"
            aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      )}

      {/* Minimalistic Cinematic Controls overlay */}
      {!minimalMode && controls && !hasError && isReady && (
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 z-30 flex flex-col justify-end"
            >
              {/* Bottom Gradient for Contrast */}
              <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

              {/* Central Play/Pause (only visible when paused, purely aesthetic) */}
              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/90">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
              )}

              {/* Controls Bar */}
              <div 
                className="relative z-40 w-full px-6 pb-6 pt-12 flex flex-col gap-4 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Hairline Scrub Bar */}
                <div className="w-full relative h-3 group/slider flex items-center cursor-pointer">
                  <input
                    type="range"
                    min={0}
                    max={0.999999}
                    step="any"
                    value={played}
                    onMouseDown={handleSeekMouseDown}
                    onTouchStart={handleSeekMouseDown}
                    onChange={handleSeekChange}
                    onMouseUp={handleSeekMouseUp}
                    onTouchEnd={handleSeekMouseUp}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Seek Video"
                  />
                  <div className="w-full h-[2px] bg-white/20 rounded-full relative transition-all group-hover/slider:h-1">
                    {/* Loaded Buffer */}
                    <div className="absolute top-0 bottom-0 left-0 bg-white/40 rounded-full" style={{ width: `${loaded * 100}%` }} />
                    {/* Current Progress */}
                    <div className="absolute top-0 bottom-0 left-0 bg-white rounded-full" style={{ width: `${played * 100}%` }} />
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  
                  <div className="flex items-center gap-6 text-white/90">
                    <button 
                      onClick={handlePlayPause}
                      className="hover:text-white hover:scale-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                      aria-label={playing ? "Pause" : "Play"}
                    >
                      {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    <button 
                      onClick={handleToggleMute}
                      className="hover:text-white hover:scale-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                      aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
                    >
                      {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    <span className="text-xs font-mono tracking-widest opacity-70 hidden sm:block select-none">
                      {formatTime(played * duration)} <span className="opacity-50 mx-1">/</span> {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-white/90">
                    {onTheatreToggle && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onTheatreToggle(); }}
                        className="text-xs font-medium uppercase tracking-widest hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded hidden md:block"
                        aria-label="Toggle Theatre Mode"
                      >
                        {isTheatre ? 'Standard' : 'Theatre'}
                      </button>
                    )}
                    
                    <button 
                      onClick={toggleFullscreen}
                      className="hover:text-white hover:scale-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                      aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>

                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
    </>
  );
};
