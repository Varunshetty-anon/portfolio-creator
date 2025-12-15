import { PortfolioData, INITIAL_DATA } from './types';

const DB_NAME = 'CineFolioDB';
const DB_VERSION = 1;
const STORE_NAME = 'portfolio_store';

// --- Brand Helpers ---

// Generate a consistent HSL color from a string
const stringToColor = (str: string, saturation = 60, lightness = 60) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, ${saturation}%, ${lightness}%)`;
};

// Heuristic to map common software names to simpleicon slugs
export const getIconSlug = (name: string): string => {
    const n = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Manual mapping for complex names
    if (n.includes('davinci')) return 'davinciresolve';
    if (n.includes('premiere')) return 'adobepremierepro';
    if (n.includes('aftereffect')) return 'adobeaftereffects';
    if (n.includes('photoshop')) return 'adobephotoshop';
    if (n.includes('illustrator')) return 'adobeillustrator';
    if (n.includes('lightroom')) return 'adobelightroom';
    if (n.includes('audition')) return 'adobeaudition';
    if (n.includes('creativecloud')) return 'adobecreativecloud';
    if (n.includes('finalcut')) return 'apple'; // No specific FCP icon usually, Apple is close
    if (n.includes('unreal')) return 'unrealengine';
    if (n.includes('c4d') || n.includes('cinema4d')) return 'cinema4d';
    if (n.includes('substance')) return 'adobe-substance-3d-painter';
    
    return n; // Fallback to cleaned name (often works for 'blender', 'figma', etc)
};

export const getBrandColor = (name: string): string => {
    const n = name.toLowerCase();
    
    // Specific Brand Colors
    if (n.includes('davinci') || n.includes('resolve')) return '#ff4747'; // Mixed but red/blue/green usually, defaulting to a vibrant red/pink
    if (n.includes('premiere')) return '#9999FF';
    if (n.includes('after')) return '#9999FF';
    if (n.includes('photoshop')) return '#31A8FF';
    if (n.includes('illustrator')) return '#FF9A00';
    if (n.includes('lightroom')) return '#31A8FF';
    if (n.includes('blender')) return '#EA7600';
    if (n.includes('unreal')) return '#0E1128';
    if (n.includes('unity')) return '#000000';
    if (n.includes('cinema')) return '#002E70';
    if (n.includes('maya')) return '#37A5CC';
    if (n.includes('runway')) return '#FA5B8E';
    if (n.includes('midjourney')) return '#FFFFFF';
    if (n.includes('veo')) return '#4285F4';
    if (n.includes('final')) return '#F6ADF6'; 
    if (n.includes('avid')) return '#6600cc';

    // Fallback: Generate one
    return stringToColor(name);
};


// --- State Encoding/Decoding ---

// Helper to encode state to Base64 for sharing via URL
export const encodeState = (data: PortfolioData): string => {
  try {
    // Clean data for sharing: remove Blobs and local-only URLs
    const cleanProjects = data.projects.map(p => {
        const isLocal = p.link.startsWith('blob:') || p.link.length > 500; // arbitrary length check for base64 data uris
        const isThumbLocal = p.thumbnail.startsWith('blob:') || p.thumbnail.length > 500;
        return {
            ...p,
            link: isLocal ? '' : p.link, 
            thumbnail: isThumbLocal ? '' : p.thumbnail,
            thumbnailBlob: undefined,
            customVideoBlob: undefined
        };
    });
    
    // Check if showreel is local
    const isShowreelLocal = data.showreelLink.startsWith('blob:') || data.showreelLink.length > 500;
    const isProfileLocal = data.profileImage.startsWith('blob:') || data.profileImage.length > 500;
    const isReelThumbLocal = data.showreelThumbnail.startsWith('blob:') || data.showreelThumbnail.length > 500;

    const cleanData = {
        ...data,
        profileImage: isProfileLocal ? '' : data.profileImage,
        showreelLink: isShowreelLocal ? '' : data.showreelLink,
        showreelThumbnail: isReelThumbLocal ? '' : data.showreelThumbnail,
        projects: cleanProjects,
        profileImageBlob: undefined,
        showreelThumbnailBlob: undefined,
        showreelBlob: undefined
    };

    const json = JSON.stringify(cleanData);
    return btoa(encodeURIComponent(json));
  } catch (e) {
    console.error("Failed to encode state", e);
    return "";
  }
};

// Helper to decode state from URL
export const decodeState = (encoded: string): PortfolioData | null => {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    
    // Merge with structure to ensure all fields exist (migrations)
    return {
        ...INITIAL_DATA,
        ...parsed,
        socials: { ...INITIAL_DATA.socials, ...parsed.socials },
        settings: { ...INITIAL_DATA.settings, ...parsed.settings },
        availability: { ...INITIAL_DATA.availability, ...parsed.availability }
    };
  } catch (e) {
    console.error("Failed to decode state", e);
    return null;
  }
};

// Helper to crop image
export const getCroppedImg = (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous'; // helpful for external images
    
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('No 2d context'));
      }

      // set canvas size to match the bounding box
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // draw the cropped image
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

      // As Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    };

    image.onerror = (error) => reject(error);
  });
};

// Helper to generate thumbnail from video file
export const generateThumbnailFromVideo = (file: File): Promise<{ url: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    
    // Seek to 1s to avoid black frame at start
    video.currentTime = 1;

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
            if (blob) {
                resolve({ url: URL.createObjectURL(blob), blob });
            } else {
                reject(new Error("Thumbnail generation failed"));
            }
            // Cleanup
            video.removeEventListener('seeked', onSeeked);
            URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.85);
      } catch (e) {
        reject(e);
      }
    };

    video.addEventListener('seeked', onSeeked);
    
    video.onerror = () => {
        reject(new Error("Video load error"));
    };
  });
};

// --- IndexedDB Database Operations ---

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveToDB = async (data: PortfolioData): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // We store the data with a fixed ID 'current'
    // IndexedDB can store Blob objects natively.
    const request = store.put({ id: 'current', ...data });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadFromDB = async (): Promise<PortfolioData | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('current');

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        // Rehydrate Blob URLs
        const rehydratedData = { ...result };

        // Profile Image
        if (rehydratedData.profileImageBlob) {
            rehydratedData.profileImage = URL.createObjectURL(rehydratedData.profileImageBlob);
        }

        // Showreel Thumbnail
        if (rehydratedData.showreelThumbnailBlob) {
            rehydratedData.showreelThumbnail = URL.createObjectURL(rehydratedData.showreelThumbnailBlob);
        }

        // Showreel Video
        if (rehydratedData.showreelBlob) {
            rehydratedData.showreelLink = URL.createObjectURL(rehydratedData.showreelBlob);
        }

        // Projects
        rehydratedData.projects = rehydratedData.projects.map((p: any) => {
            const newP = { ...p };
            if (newP.thumbnailBlob) {
                newP.thumbnail = URL.createObjectURL(newP.thumbnailBlob);
            }
            if (newP.customVideoBlob) {
                newP.link = URL.createObjectURL(newP.customVideoBlob);
            }
            return newP;
        });

        resolve(rehydratedData);
      } else {
        resolve(null);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
};