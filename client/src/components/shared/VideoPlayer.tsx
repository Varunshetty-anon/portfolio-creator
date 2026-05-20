// ========================
// FRAMES VideoPlayer Component
// ========================
// Multi-platform video player supporting YouTube, Vimeo, and native video.
// Preserved and improved from the original PortfolioView.tsx.

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, AlertCircle } from 'lucide-react';
import { getYouTubeId, getVimeoId, isNativeVideo } from '@/lib/media-utils';

interface VideoPlayerProps {
  url: string;
  thumbnail?: string;
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  className?: string;
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
  controls = false,
  loop = true,
  className = '',
}) => {
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const youtubeId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const isNative = isNativeVideo(url);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Auto-play native video
  useEffect(() => {
    if (isNative && videoRef.current && autoplay) {
      videoRef.current.play().catch(() => {});
    }
  }, [isNative, autoplay]);

  if (!url) return null;

  const renderPlayer = () => {
    // YouTube embed
    if (youtubeId) {
      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        mute: isMuted ? '1' : '0',
        controls: controls ? '1' : '0',
        loop: loop ? '1' : '0',
        playlist: youtubeId,
        playsinline: '1',
        rel: '0',
        modestbranding: '1',
        showinfo: '0',
      });

      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?${params.toString()}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{ pointerEvents: controls ? 'auto' : 'none' }}
        />
      );
    }

    // Vimeo embed
    if (vimeoId) {
      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        muted: isMuted ? '1' : '0',
        loop: loop ? '1' : '0',
        background: !controls ? '1' : '0',
        playsinline: '1',
      });

      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?${params.toString()}`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{ pointerEvents: controls ? 'auto' : 'none' }}
        />
      );
    }

    // Native video
    if (isNative || url) {
      return (
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay={autoplay}
          muted={isMuted}
          loop={loop}
          playsInline
          controls={controls}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          preload="metadata"
        />
      );
    }

    return null;
  };

  return (
    <div
      className={`relative overflow-hidden bg-zinc-950 rounded-xl ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* Thumbnail background (shown while loading) */}
      <AnimatePresence>
        {!isLoaded && thumbnail && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10"
          >
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Play size={20} className="text-white ml-0.5" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950">
          {thumbnail && (
            <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
          )}
          <AlertCircle size={28} className="text-zinc-600 mb-3" />
          <p className="text-zinc-600 text-xs font-medium">Video unavailable</p>
        </div>
      )}

      {/* Video player */}
      {!hasError && renderPlayer()}

      {/* Mute toggle */}
      {!hasError && isLoaded && (isNative || youtubeId) && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </motion.button>
      )}
    </div>
  );
};
