import { PortfolioData, INITIAL_DATA } from './types';
import { db, storage, isConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const COLLECTION_NAME = 'portfolios';
const MAIN_DOC_ID = 'main_portfolio';
const LOCAL_STORAGE_KEY = 'frames_portfolio_data';
const DB_TIMEOUT_MS = 2500; // Timeout for DB operations

export { isConfigured };
export const hasCloudStorage = !!storage;


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
    if (n.includes('finalcut')) return 'apple';
    if (n.includes('unreal')) return 'unrealengine';
    if (n.includes('c4d') || n.includes('cinema4d')) return 'cinema4d';
    if (n.includes('substance')) return 'adobe-substance-3d-painter';
    
    return n;
};

export const getBrandColor = (name: string): string => {
    const n = name.toLowerCase();
    
    // Specific Brand Colors
    if (n.includes('davinci') || n.includes('resolve')) return '#ff4747';
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

    return stringToColor(name);
};

// --- State Encoding/Decoding ---

export const encodeState = (data: PortfolioData): string => {
  try {
    const cleanProjects = data.projects.map(p => {
        // PRESERVE CLOUD LINKS: Only strip if it's a blob OR extremely large non-http string (base64)
        const isBlob = p.link.startsWith('blob:');
        const isTooLarge = p.link.length > 50000 && !p.link.startsWith('http');
        const isLinkLocal = isBlob || isTooLarge;

        const isThumbBlob = p.thumbnail.startsWith('blob:');
        const isThumbTooLarge = p.thumbnail.length > 50000 && !p.thumbnail.startsWith('http');
        const isThumbLocal = isThumbBlob || isThumbTooLarge;

        return {
            ...p,
            link: isLinkLocal ? '' : p.link, 
            thumbnail: isThumbLocal ? '' : p.thumbnail,
            thumbnailBlob: undefined,
            customVideoBlob: undefined
        };
    });
    
    const isShowreelBlob = data.showreelLink.startsWith('blob:');
    const isShowreelTooLarge = data.showreelLink.length > 50000 && !data.showreelLink.startsWith('http');
    const isShowreelLocal = isShowreelBlob || isShowreelTooLarge;

    const isProfileBlob = data.profileImage.startsWith('blob:');
    const isProfileTooLarge = data.profileImage.length > 50000 && !data.profileImage.startsWith('http');
    const isProfileLocal = isProfileBlob || isProfileTooLarge;

    const cleanData = {
        ...data,
        profileImage: isProfileLocal ? '' : data.profileImage,
        showreelLink: isShowreelLocal ? '' : data.showreelLink,
        // Thumbnails are often small enough base64, but if huge, strip them.
        showreelThumbnail: (data.showreelThumbnail.length > 50000 && !data.showreelThumbnail.startsWith('http')) ? '' : data.showreelThumbnail,
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

export const decodeState = (encoded: string): PortfolioData | null => {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    
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

export const getCroppedImg = (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous'; 
    
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('No 2d context'));
      }
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

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

export const generateThumbnailFromVideo = (file: File): Promise<{ url: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
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

// --- Storage Operations ---

// Helper: Convert Blob to Base64 String
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Upload Helper for Firebase Storage
export const uploadFileToStorage = (file: File, path: string, onProgress?: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!storage) {
            reject(new Error("Storage not configured or unavailable"));
            return;
        }
        
        try {
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                }, 
                (error) => {
                    console.error("Upload failed", error);
                    reject(error);
                }, 
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        resolve(downloadURL);
                    });
                }
            );
        } catch (e) {
            reject(e);
        }
    });
};

export const saveToDB = async (data: PortfolioData): Promise<void> => {
  // Deep clone to prepare for serialization
  const dataToSave: any = { ...data };

  // --- 1. IMAGE CONVERSION (Blob -> Base64) ---
  if (dataToSave.profileImageBlob) {
    dataToSave.profileImage = await blobToBase64(dataToSave.profileImageBlob);
  }
  delete dataToSave.profileImageBlob;

  if (dataToSave.showreelThumbnailBlob) {
    dataToSave.showreelThumbnail = await blobToBase64(dataToSave.showreelThumbnailBlob);
  }
  delete dataToSave.showreelThumbnailBlob;

  // --- 2. VIDEO HANDLING ---
  if (dataToSave.showreelBlob) {
      if (dataToSave.showreelLink && dataToSave.showreelLink.startsWith('blob:')) {
           console.warn("Unsaved blob detected for showreel. Clearing to prevent DB crash.");
           dataToSave.showreelLink = ""; 
      }
  }
  delete dataToSave.showreelBlob;

  // Projects Processing
  if (dataToSave.projects) {
      dataToSave.projects = await Promise.all(dataToSave.projects.map(async (p: any) => {
          const newP = { ...p };
          
          if (newP.thumbnailBlob) {
              newP.thumbnail = await blobToBase64(newP.thumbnailBlob);
          }
          delete newP.thumbnailBlob;

          if (newP.customVideoBlob) {
              if (newP.link && newP.link.startsWith('blob:')) {
                   console.warn(`Unsaved blob detected for project ${newP.id}. Clearing.`);
                   newP.link = "";
              }
          }
          delete newP.customVideoBlob;
          
          return newP;
      }));
  }

  // --- 3. SAVE ---
  
  // Try Firestore if configured
  if (isConfigured && db) {
      try {
          // Race against a timeout to prevent hanging on "Connection failed"
          const savePromise = setDoc(doc(db, COLLECTION_NAME, MAIN_DOC_ID), dataToSave);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), DB_TIMEOUT_MS));
          
          await Promise.race([savePromise, timeoutPromise]);
      } catch (e) {
          console.warn("Firestore save failed (offline or db not created), falling back to Local Storage.", e);
      }
  }

  // Local Storage Fallback (Always save to local as backup)
  try {
     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e: any) {
     console.error("Local Storage save failed", e);
     if (e.name === 'QuotaExceededError') {
         alert("Storage Limit Reached: Please use external links for images/videos or compress them.");
     }
  }
};

export const loadFromDB = async (): Promise<PortfolioData | null> => {
  // Try Firestore if configured
  if (isConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, MAIN_DOC_ID);
        
        // Race against a timeout to prevent hanging on initial load if DB is missing/offline
        const loadPromise = getDoc(docRef);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), DB_TIMEOUT_MS));

        const docSnap = await Promise.race([loadPromise, timeoutPromise]) as any;

        if (docSnap && docSnap.exists()) {
          console.log("✅ Successfully connected to Firebase.");
          return docSnap.data() as PortfolioData;
        }
      } catch (e) {
        console.warn("Firestore load failed, checking Local Storage.", e);
      }
  }

  // Local Storage Fallback
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
      try {
          return JSON.parse(local) as PortfolioData;
      } catch (e) {
          console.error("Error parsing local data", e);
      }
  }

  console.log("No data found in DB or Local Storage.");
  return null;
};