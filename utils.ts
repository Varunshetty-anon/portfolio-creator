import { PortfolioData, INITIAL_DATA, Project } from './types';
import { db, storage, auth, googleProvider, isConfigured } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";

const COLLECTION_NAME = 'portfolios';
const LOCAL_STORAGE_KEY = 'frames_portfolio_data';

export { isConfigured, auth };
export const hasCloudStorage = !!storage;

// --- AI Integration ---
const genAI = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

export const generateAiBio = async (role: string, skills: string[], tone: string = "professional"): Promise<string> => {
  if (!genAI) {
      console.warn("Gemini API Key not found.");
      return "I create visual stories that leave an impact. (AI Key missing)";
  }

  try {
      const prompt = `Write a short, engaging, 2-sentence bio for a ${role} who specializes in ${skills.join(', ')}. The tone should be ${tone}. Do not include hashtags.`;
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
  } catch (error) {
      console.error("AI Bio Generation failed:", error);
      return "Passionate creator dedicated to crafting exceptional visual experiences.";
  }
};

export const generateAiDescription = async (title: string, currentDesc: string): Promise<string> => {
    if (!genAI) return currentDesc;
    try {
        const prompt = `Rewrite this video project description to be more professional and engaging for a portfolio. 
        Project Title: "${title}". 
        Draft Description: "${currentDesc}".
        Keep it under 30 words.`;
        
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (e) {
        console.error("AI Desc failed", e);
        return currentDesc;
    }
}


// --- Brand Helpers ---
const stringToColor = (str: string, saturation = 60, lightness = 60) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, ${saturation}%, ${lightness}%)`;
};

export const getIconSlug = (name: string): string => {
    const n = name.toLowerCase().replace(/[^a-z0-9]/g, '');
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
        const isBlob = p.link.startsWith('blob:');
        const isTooLarge = p.link.length > 50000 && !p.link.startsWith('http');
        return {
            ...p,
            link: (isBlob || isTooLarge) ? '' : p.link, 
            thumbnail: (p.thumbnail.startsWith('blob:') || p.thumbnail.length > 50000) ? '' : p.thumbnail,
            thumbnailBlob: undefined,
            customVideoBlob: undefined
        };
    });
    
    const cleanData = {
        ...data,
        profileImage: (data.profileImage.startsWith('blob:') || data.profileImage.length > 50000) ? '' : data.profileImage,
        showreelLink: (data.showreelLink.startsWith('blob:') || data.showreelLink.length > 50000) ? '' : data.showreelLink,
        showreelThumbnail: (data.showreelThumbnail.startsWith('blob:') || data.showreelThumbnail.length > 50000) ? '' : data.showreelThumbnail,
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
      if (!ctx) return reject(new Error('No 2d context'));
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas is empty'));
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
        if (!ctx) { reject(new Error("Canvas context failed")); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (blob) { resolve({ url: URL.createObjectURL(blob), blob }); } 
            else { reject(new Error("Thumbnail generation failed")); }
            video.removeEventListener('seeked', onSeeked);
            URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.85);
      } catch (e) { reject(e); }
    };
    video.addEventListener('seeked', onSeeked);
    video.onerror = () => { reject(new Error("Video load error")); };
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

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
                (error) => { reject(error); }, 
                () => { getDownloadURL(uploadTask.snapshot.ref).then(resolve); }
            );
        } catch (e) { reject(e); }
    });
};

// --- AUTH & DATABASE ---

// Check if username is taken
export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!db || !username) return true; // Assume available if offline
    try {
        const q = query(collection(db, COLLECTION_NAME), where("username", "==", username));
        const docs = await getDocs(q);
        return docs.empty;
    } catch (e: any) {
        // If permission denied (e.g. strict rules on unauthenticated users), skip check
        console.warn("Username availability check skipped:", e.message);
        return true;
    }
};

export const saveToDB = async (data: PortfolioData): Promise<void> => {
  const dataToSave: any = { ...data };

  // Convert blobs
  if (dataToSave.profileImageBlob) {
    dataToSave.profileImage = await blobToBase64(dataToSave.profileImageBlob);
  }
  delete dataToSave.profileImageBlob;

  if (dataToSave.showreelThumbnailBlob) {
    dataToSave.showreelThumbnail = await blobToBase64(dataToSave.showreelThumbnailBlob);
  }
  delete dataToSave.showreelThumbnailBlob;
  delete dataToSave.showreelBlob;

  if (dataToSave.projects) {
      dataToSave.projects = await Promise.all(dataToSave.projects.map(async (p: any) => {
          const newP = { ...p };
          if (newP.thumbnailBlob) newP.thumbnail = await blobToBase64(newP.thumbnailBlob);
          delete newP.thumbnailBlob;
          delete newP.customVideoBlob;
          return newP;
      }));
  }

  // Save to Firestore using UID or Username as key
  if (isConfigured && db) {
      try {
          const docId = data.uid || 'guest_user';
          await setDoc(doc(db, COLLECTION_NAME, docId), dataToSave);
      } catch (e) {
          console.warn("Firestore save failed", e);
      }
  }

  // Local Storage Backup
  try {
     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {}
};

export const loadFromDB = async (identifier?: string): Promise<PortfolioData | null> => {
  if (isConfigured && db) {
      try {
        let docSnap;
        
        // If identifier is provided, check if it's a UID (by checking direct doc) or a username (query)
        if (identifier) {
            // 1. Try direct ID (UID)
            const docRef = doc(db, COLLECTION_NAME, identifier);
            docSnap = await getDoc(docRef);
            
            // 2. If not found, try searching by username
            if (!docSnap.exists()) {
                const q = query(collection(db, COLLECTION_NAME), where("username", "==", identifier));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    docSnap = querySnap.docs[0];
                }
            }
        } else {
             // Default load (legacy main_portfolio or local)
             return null;
        }

        if (docSnap && docSnap.exists()) {
          return docSnap.data() as PortfolioData;
        }
      } catch (e) {
        console.warn("Firestore load failed", e);
      }
  }
  return null;
};

// --- AUTH ACTIONS ---
export const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth not configured");
    return signInWithEmailAndPassword(auth, email, pass);
};

export const signupWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth not configured");
    return createUserWithEmailAndPassword(auth, email, pass);
};

export const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Auth not configured");
    return signInWithPopup(auth, googleProvider);
};