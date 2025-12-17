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

// --- CONSTANTS ---
// Updated slugs for simpleicons.org accuracy and added domains for fallback
export const EDITING_TOOLS_LIST = [
  { name: 'Premiere Pro', slug: 'adobepremierepro', domain: 'adobe.com', color: '#9999FF' },
  { name: 'After Effects', slug: 'adobeaftereffects', domain: 'adobe.com', color: '#9999FF' },
  { name: 'DaVinci Resolve', slug: 'davinciresolve', domain: 'blackmagicdesign.com', color: '#ff4747' },
  { name: 'Final Cut Pro', slug: 'finalcutpro', domain: 'apple.com', color: '#ffffff' },
  { name: 'CapCut', slug: 'capcut', domain: 'capcut.com', color: '#000000' },
  { name: 'Avid Media Composer', slug: 'avid', domain: 'avid.com', color: '#6600cc' },
  { name: 'Blender', slug: 'blender', domain: 'blender.org', color: '#EA7600' },
  { name: 'Cinema 4D', slug: 'cinema4d', domain: 'maxon.net', color: '#002E70' },
  { name: 'Unreal Engine', slug: 'unrealengine', domain: 'unrealengine.com', color: '#0E1128' },
  { name: 'Photoshop', slug: 'adobephotoshop', domain: 'adobe.com', color: '#31A8FF' },
  { name: 'Illustrator', slug: 'adobeillustrator', domain: 'adobe.com', color: '#FF9A00' },
  { name: 'Sony Vegas', slug: 'vegas', domain: 'vegascreativesoftware.com', color: '#ffffff' },
  { name: 'Nuke', slug: 'nuke', domain: 'foundry.com', color: '#F7C429' },
  { name: 'Maya', slug: 'autodeskmaya', domain: 'autodesk.com', color: '#37A5CC' },
  { name: 'Houdini', slug: 'houdini', domain: 'sidefx.com', color: '#FF4611' }
];

export const AI_TOOLS_LIST = [
  { name: 'Midjourney', slug: 'midjourney', domain: 'midjourney.com', color: '#ffffff' },
  { name: 'RunwayML', slug: 'runway', domain: 'runwayml.com', color: '#FA5B8E' },
  { name: 'ChatGPT', slug: 'openai', domain: 'openai.com', color: '#10A37F' },
  { name: 'DALL-E', slug: 'openai', domain: 'openai.com', color: '#10A37F' },
  { name: 'Stable Diffusion', slug: 'stabilityai', domain: 'stability.ai', color: '#ffffff' },
  { name: 'Topaz Video AI', slug: 'topaz', domain: 'topazlabs.com', color: '#ffffff' },
  { name: 'Luma Dream Machine', slug: 'luma', domain: 'lumalabs.ai', color: '#ffffff' },
  { name: 'Pika Labs', slug: 'pika', domain: 'pika.art', color: '#ffffff' },
  { name: 'Kling AI', slug: 'kling', domain: 'kling.ai', color: '#ffffff' },
  { name: 'ElevenLabs', slug: 'elevenlabs', domain: 'elevenlabs.io', color: '#ffffff' },
  { name: 'Sora', slug: 'openai', domain: 'openai.com', color: '#ffffff' },
  { name: 'Google Veo', slug: 'google', domain: 'deepmind.google', color: '#4285F4' },
  { name: 'Descript', slug: 'descript', domain: 'descript.com', color: '#17E088' },
  { name: 'Submagic', slug: 'submagic', domain: 'submagic.co', color: '#F6ADF6' }
];

// --- Helpers ---
export const getDriveEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/open\?id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }
    return null;
};

export const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getYouTubeThumbnail = (url: string): string | null => {
    const id = getYouTubeId(url);
    if (id) {
        return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
    return null;
};

export const checkPortfolioReadiness = (data: PortfolioData): { isReady: boolean; missing: string[] } => {
    const missing: string[] = [];
    
    // Strict Mandatory Fields
    if (!data.bio || data.bio.length < 10) missing.push("Bio (min 10 chars)");
    if (!data.projects || data.projects.length === 0) missing.push("At least 1 Project");
    if (!data.primaryTool) missing.push("Primary Workflow Tool");
    if (!data.showreelLink) missing.push("Showreel (Required)");
    
    // Profile Image Check (Must not be default)
    const isDefaultImage = data.profileImage.includes('picsum') || data.profileImage.includes('unsplash');
    if (!data.profileImage || isDefaultImage) missing.push("Custom Profile Picture");

    // Socials Check
    const hasSocials = Object.values(data.socials).some(val => val && val.length > 0);
    if (!hasSocials) missing.push("At least 1 Social Link");

    return { isReady: missing.length === 0, missing };
};

export const downloadQrCode = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        console.error("QR Download failed", e);
        window.open(url, '_blank');
    }
};


// --- AI Integration ---
// API Key is strictly from process.env.API_KEY
const genAI = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

export const generateAiBio = async (currentBio: string, role: string, skills: string[]): Promise<string> => {
  if (!genAI) {
      console.warn("Gemini API Key not found in environment.");
      return currentBio;
  }

  try {
      const prompt = `Rewrite this bio to be professional, human, and creative.
      Context: Role: ${role}, Skills: ${skills.join(', ')}.
      Current Draft: "${currentBio}"
      Strict Rules:
      1. Maximum 2-3 sentences.
      2. ABSOLUTELY NO em dashes (—).
      3. ABSOLUTELY NO bullet points.
      4. Do not use hashtags.
      5. Make it sound punchy, confident, and "crazy good".
      `;
      
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
  } catch (error: any) {
      if (error?.message?.includes('leaked') || error?.status === 403 || error?.status === 'PERMISSION_DENIED') {
          console.warn("Gemini API Error: Key invalid.");
          return currentBio;
      }
      console.error("AI Bio Generation failed:", error);
      return currentBio;
  }
};

export const generateAiDescription = async (title: string, category: string, currentDesc: string): Promise<string> => {
    if (!genAI) return currentDesc;
    try {
        const prompt = `Rewrite this project description to be punchy, engaging, and professional.
        Project: "${title}" (${category}).
        Current Draft: "${currentDesc}".
        Strict Rules:
        1. Maximum 2 sentences.
        2. ABSOLUTELY NO em dashes (—).
        3. ABSOLUTELY NO bullet points.
        4. Focus on the creative impact.
        `;
        
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (e: any) {
        if (e?.message?.includes('leaked') || e?.status === 403 || e?.status === 'PERMISSION_DENIED') {
             console.warn("Gemini API Error: Key invalid.");
             return currentDesc;
        }
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

export const getBrandColor = (name: string): string => {
    // Check our predefined lists first
    const editTool = EDITING_TOOLS_LIST.find(t => t.name === name);
    if (editTool) return editTool.color;
    
    const aiTool = AI_TOOLS_LIST.find(t => t.name === name);
    if (aiTool) return aiTool.color;

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
      }, 'image/jpeg', 0.80); // Lowered quality to 0.80 for faster upload
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
        }, 'image/jpeg', 0.80); // Lowered quality to 0.80
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

export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!db || !username) return true; // Assume available if offline
    try {
        const q = query(collection(db, COLLECTION_NAME), where("username", "==", username));
        const docs = await getDocs(q);
        return docs.empty;
    } catch (e: any) {
        console.warn("Username availability check skipped:", e.message);
        return true;
    }
};

export const saveToDB = async (data: PortfolioData): Promise<void> => {
  if (!data.uid || data.uid === 'guest') {
     console.warn("Attempted to save data without a valid UID. Skipping.");
     return;
  }

  const dataToSave: any = { ...data };
  
  if (dataToSave.projects) {
      dataToSave.projects = dataToSave.projects.map((p: any) => {
          const cleanP = { ...p };
          delete cleanP.thumbnailBlob;
          delete cleanP.customVideoBlob;
          return cleanP;
      });
  }
  
  delete dataToSave.profileImageBlob;
  delete dataToSave.showreelThumbnailBlob;
  delete dataToSave.showreelBlob;

  if (isConfigured && db) {
      try {
          await setDoc(doc(db, COLLECTION_NAME, data.uid), dataToSave);
      } catch (e) {
          console.warn("Firestore save failed", e);
          throw e; 
      }
  }

  try {
     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {}
};

export const loadFromDB = async (identifier?: string): Promise<PortfolioData | null> => {
  if (isConfigured && db) {
      try {
        let docSnap;
        if (identifier) {
            const docRef = doc(db, COLLECTION_NAME, identifier);
            try {
                docSnap = await getDoc(docRef);
            } catch (e) {}
        }

        if (!docSnap || !docSnap.exists()) {
             const q = query(collection(db, COLLECTION_NAME), where("username", "==", identifier));
             const querySnap = await getDocs(q);
             if (!querySnap.empty) {
                 docSnap = querySnap.docs[0];
             }
        }

        if (docSnap && docSnap.exists()) {
          return docSnap.data() as PortfolioData;
        }
      } catch (e) {
        console.warn("Firestore load failed", e);
        throw e;
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