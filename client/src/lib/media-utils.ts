// ========================
// FRAMES Media Utilities
// ========================
// Client-side helpers for video/image processing.
// Preserved and improved from the original lib/utils.ts.

/**
 * Detect aspect ratio from width/height dimensions.
 */
export const getAspectRatioFromDims = (
  w: number,
  h: number
): '16:9' | '9:16' | '4:3' | '1:1' => {
  if (!w || !h) return '16:9';
  const ratio = w / h;
  if (ratio >= 1.5) return '16:9';
  if (ratio <= 0.85) return '9:16';
  if (ratio > 0.85 && ratio < 1.15) return '1:1';
  return '4:3';
};

/**
 * Probe image dimensions by loading it in the browser.
 */
export const probeImageDimensions = (
  url: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Image probe failed'));
    img.src = url;
  });
};

/**
 * Extract YouTube video ID and return maxresdefault thumbnail URL.
 */
export const getYouTubeThumbnail = (url: string): string | null => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`
    : null;
};

/**
 * Extract YouTube video ID from URL.
 */
export const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

/**
 * Extract Vimeo video ID from URL.
 */
export const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:vimeo\.com\/)(?:channels\/[\w]+\/|groups\/[\w]+\/videos\/|video\/|)(\d+)/
  );
  return match ? match[1] : null;
};

/**
 * Detect video source type from URL.
 */
export const detectVideoSource = (
  url: string
): 'youtube' | 'vimeo' | 'cloudinary' | 'direct' => {
  if (!url) return 'direct';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (u.includes('cloudinary.com') || u.includes('res.cloudinary.com'))
    return 'cloudinary';
  return 'direct';
};

/**
 * Check if URL is a natively streamable video (not an embed).
 */
export const isNativeVideo = (url: string): boolean => {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('cloudinary.com') ||
    u.includes('dl.dropboxusercontent.com') ||
    u.endsWith('.mp4') ||
    u.endsWith('.webm') ||
    u.endsWith('.mov')
  );
};

/**
 * Fetch video metadata (thumbnail + aspect ratio) from oEmbed APIs.
 */
export const getVideoMetadata = async (
  url: string
): Promise<{
  thumbnail: string | null;
  aspectRatio: '16:9' | '9:16' | '4:3' | '1:1';
}> => {
  let thumbnail: string | null = null;
  let aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' = '16:9';

  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      thumbnail = getYouTubeThumbnail(url);
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.width && data.height) {
            aspectRatio = getAspectRatioFromDims(data.width, data.height);
          }
        }
      } catch {
        aspectRatio = '16:9';
      }
    } else if (url.includes('vimeo.com')) {
      try {
        const res = await fetch(
          `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.thumbnail_url) thumbnail = data.thumbnail_url;
          if (data.width && data.height) {
            aspectRatio = getAspectRatioFromDims(data.width, data.height);
          }
        }
      } catch {
        aspectRatio = '16:9';
      }
    }
  } catch (e) {
    console.error('Metadata fetch failed', e);
  }

  return { thumbnail, aspectRatio };
};

/**
 * Generate a thumbnail from a video File using canvas capture.
 */
export const generateThumbnailFromVideo = (
  file: File
): Promise<{
  url: string;
  blob: Blob;
  aspectRatio: '16:9' | '9:16' | '4:3' | '1:1';
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;

    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Video load timeout'));
    }, 15000);

    video.onloadedmetadata = () => {
      let seekTime = Math.min(1, video.duration * 0.1);
      if (!isFinite(seekTime)) seekTime = 0;
      video.currentTime = seekTime;
    };

    const onSeeked = () => {
      clearTimeout(timeout);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = getAspectRatioFromDims(width, height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(fileUrl);
        return reject(new Error('Canvas failure'));
      }

      ctx.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(fileUrl);
          if (blob)
            resolve({ url: URL.createObjectURL(blob), blob, aspectRatio });
          else reject(new Error('Blob failure'));
        },
        'image/jpeg',
        0.85
      );
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Video load error'));
    };
  });
};

/**
 * Crop an image using canvas.
 */
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not found'));
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        },
        'image/jpeg',
        0.9
      );
    };
    image.onerror = (e) => reject(e);
  });
};

/**
 * Smart URL construction for social links.
 * Auto-prefixes protocol and handles @handles.
 */
export const ensureSocialUrl = (
  platform: string,
  value: string
): string => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.includes('mailto:')) return value;

  // Email detection
  if (value.includes('@') && value.includes('.') && !value.startsWith('@')) {
    return `mailto:${value}`;
  }

  const handle = value.startsWith('@') ? value.slice(1) : value;

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'twitter':
      return `https://x.com/${handle}`;
    case 'youtube':
      return `https://youtube.com/@${handle}`;
    case 'linkedin':
      return value.includes('linkedin.com')
        ? `https://${value}`
        : `https://linkedin.com/in/${handle}`;
    case 'discord':
      if (value.includes('discord.gg') || value.includes('discord.com'))
        return `https://${value}`;
      return `https://discord.gg/${handle}`;
    default:
      return `https://${value}`;
  }
};
