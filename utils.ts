
import { PortfolioData, INITIAL_DATA, Project } from './types';
import { db, storage, auth, googleProvider, isConfigured } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, User, deleteUser } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";

const COLLECTION_NAME = 'portfolios';
const LOCAL_STORAGE_KEY = 'frames_portfolio_data';

export { isConfigured, auth };
export const hasCloudStorage = !!storage;

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
  { name: 'Descript', slug: 'descrypt', domain: 'descript.com', color: '#17E088' },
  { name: 'Submagic', slug: 'submagic', domain: 'submagic.co', color: '#F6ADF6' }
];

export const getYouTubeThumbnail = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg` : null;
};

export const getDriveId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/open\?id=([a-zA-Z0-9_-]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

export const getDriveEmbedUrl = (url: string): string | null => {
  const id = getDriveId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
};

// Added missing getDriveThumbnail export for video projects
export const getDriveThumbnail = (url: string): string | null => {
  const id = getDriveId(url);
  return id ? `https://lh3.googleusercontent.com/u/0/d/${id}=w1000` : null;
};

export const checkPortfolioReadiness = (data: PortfolioData): { isReady: boolean; missing: string[] } => {
  const missing: string[] = [];
  if (!data.name || data.name.length < 2) missing.push("Your Name");
  if (!data.bio || data.bio.length < 10) missing.push("Bio (min 10 chars)");
  if (!data.projects || data.projects.length === 0) missing.push("At least 1 Project");
  if (!data.primaryTool) missing.push("Primary Software");
  if (!data.showreelLink) missing.push("Showreel Link");
  return { isReady: missing.length === 0, missing };
};

export const saveToDB = async (data: PortfolioData): Promise<void> => {
  if (!data.uid || data.uid === 'guest') return;
  
  // Create a clean, serializable object for Firestore
  const cleanData = JSON.parse(JSON.stringify(data));
  
  // Explicitly remove binary/local blob properties before DB write
  const stripBlobs = (obj: any) => {
    delete obj.profileImageBlob;
    delete obj.showreelThumbnailBlob;
    delete obj.showreelBlob;
    if (obj.projects) {
      obj.projects.forEach((p: any) => {
        delete p.thumbnailBlob;
        delete p.customVideoBlob;
      });
    }
  };
  stripBlobs(cleanData);

  if (isConfigured && db) {
    const docRef = doc(db, COLLECTION_NAME, data.uid);
    // Overwrite with clean data to ensure absolute state sync
    await setDoc(docRef, { ...cleanData, lastUpdated: Date.now() });
  }
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanData));
};

export const loadFromDB = async (identifier: string): Promise<PortfolioData | null> => {
  if (!isConfigured || !db) return null;
  
  try {
    // 1. Try to load by UID directly (fastest)
    const docRef = doc(db, COLLECTION_NAME, identifier);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as PortfolioData;
    }
    
    // 2. Try to load by username (public link resolution)
    const q = query(collection(db, COLLECTION_NAME), where("username", "==", identifier.toLowerCase()));
    const querySnap = await getDocs(q);
    
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as PortfolioData;
    }
  } catch (error) {
    console.error("Firestore Load Error:", error);
  }
  return null;
};

export const uploadFileToStorage = (file: File, path: string, onProgress?: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!storage) return reject(new Error("Storage not configured"));
    
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      }, 
      (error) => reject(error), 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

export const generateThumbnailFromVideo = (file: File): Promise<{ url: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 1; // Capture frame at 1s
    
    const onSeeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas failure"));
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve({ url: URL.createObjectURL(blob), blob });
        else reject(new Error("Blob failure"));
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    };

    video.addEventListener('seeked', onSeeked);
    video.onerror = () => reject(new Error("Video load error"));
  });
};

// Added missing getCroppedImg export for profile picture handling
export const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous'; // Support cross-origin images for canvas operations
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

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/jpeg', 0.9);
    };
    image.onerror = (e) => reject(e);
  });
};

export const generateAiBio = async (currentBio: string, role: string, skills: string[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite this video editor bio to be high-end and professional. Role: ${role}. Skills: ${skills.join(', ')}. Bio: "${currentBio}". Max 3 sentences.`,
    });
    return response.text?.trim() || currentBio;
  } catch (e) { return currentBio; }
};

export const generateAiDescription = async (title: string, category: string, currentDesc: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite this project description to be punchy for a portfolio. Title: ${title}. Category: ${category}. Draft: "${currentDesc}". Max 2 sentences.`,
    });
    return response.text?.trim() || currentDesc;
  } catch (e) { return currentDesc; }
};

export const generateAiThumbnail = async (title: string, category: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Cinematic professional video project thumbnail for "${title}" in category "${category}". High contrast, dramatic lighting, 4k.` }] }
    });
    for (const cand of response.candidates || []) {
      for (const part of cand.content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (e) { return ''; }
};

export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  if (!db || !username) return true;
  const q = query(collection(db, COLLECTION_NAME), where("username", "==", username.toLowerCase()));
  const docs = await getDocs(q);
  return docs.empty;
};

export const getBrandColor = (name: string): string => {
  const tool = [...EDITING_TOOLS_LIST, ...AI_TOOLS_LIST].find(t => t.name === name);
  return tool?.color || '#ffffff';
};

export const downloadQrCode = async (url: string, filename: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const loginWithEmail = (e: string, p: string) => signInWithEmailAndPassword(auth!, e, p);
export const signupWithEmail = (e: string, p: string) => createUserWithEmailAndPassword(auth!, e, p);
export const loginWithGoogle = () => signInWithPopup(auth!, googleProvider!);
export const deletePortfolioFromDB = async (uid: string) => {
  if (db && uid) await deleteDoc(doc(db, COLLECTION_NAME, uid));
};
export const deleteUserAuth = async () => {
  if (auth?.currentUser) await deleteUser(auth.currentUser);
};
