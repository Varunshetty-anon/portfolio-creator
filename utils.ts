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

export const getDriveId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/
  ];
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

export const getDriveThumbnail = (url: string): string | null => {
  const id = getDriveId(url);
  // High quality thumbnail export for publicly shared drive items
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1200` : null;
};

export const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getYouTubeThumbnail = (url: string): string | null => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
};

export const checkPortfolioReadiness = (data: PortfolioData): { isReady: boolean; missing: string[] } => {
  const missing: string[] = [];
  if (!data.bio || data.bio.length < 10) missing.push("Bio (min 10 chars)");
  if (!data.projects || data.projects.length === 0) missing.push("At least 1 Project");
  if (!data.primaryTool) missing.push("Primary Workflow Tool");
  if (!data.showreelLink) missing.push("Showreel (Required)");
  const isDefaultImage = data.profileImage.includes('picsum') || data.profileImage.includes('unsplash');
  if (!data.profileImage || isDefaultImage) missing.push("Custom Profile Picture");
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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAiBio = async (currentBio: string, role: string, skills: string[]): Promise<string> => {
  try {
    const prompt = `Rewrite this bio to be professional, human, and creative. Role: ${role}, Skills: ${skills.join(', ')}. Current Draft: "${currentBio}". Rules: 2-3 sentences max. No bullet points. No hashtags. Sound punchy and premium.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || currentBio;
  } catch (error) {
    console.error("AI Bio Generation failed:", error);
    return currentBio;
  }
};

export const generateAiDescription = async (title: string, category: string, currentDesc: string): Promise<string> => {
  try {
    const prompt = `Rewrite this project description to be punchy and professional for a video editor portfolio. Project: "${title}" (${category}). Draft: "${currentDesc}". Rules: 2 sentences max. No bullet points.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || currentDesc;
  } catch (e) {
    console.error("AI Desc failed", e);
    return currentDesc;
  }
};

export const getBrandColor = (name: string): string => {
  const editTool = EDITING_TOOLS_LIST.find(t => t.name === name);
  if (editTool) return editTool.color;
  const aiTool = AI_TOOLS_LIST.find(t => t.name === name);
  if (aiTool) return aiTool.color;
  const n = name.toLowerCase();
  if (n.includes('davinci')) return '#ff4747';
  if (n.includes('premiere')) return '#9999FF';
  return '#ffffff';
};

export const encodeState = (data: PortfolioData): string => {
  try {
    const cleanProjects = data.projects.map(p => ({
      ...p,
      link: p.link.startsWith('blob:') ? '' : p.link, 
      thumbnail: p.thumbnail.startsWith('blob:') ? '' : p.thumbnail,
      thumbnailBlob: undefined,
      customVideoBlob: undefined
    }));
    const cleanData = {
      ...data,
      profileImage: data.profileImage.startsWith('blob:') ? '' : data.profileImage,
      showreelLink: data.showreelLink.startsWith('blob:') ? '' : data.showreelLink,
      showreelThumbnail: data.showreelThumbnail.startsWith('blob:') ? '' : data.showreelThumbnail,
      projects: cleanProjects,
      profileImageBlob: undefined,
      showreelThumbnailBlob: undefined,
      showreelBlob: undefined
    };
    return btoa(encodeURIComponent(JSON.stringify(cleanData)));
  } catch (e) {
    console.error("Failed to encode state", e);
    return "";
  }
};

export const decodeState = (encoded: string): PortfolioData | null => {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    return { ...INITIAL_DATA, ...parsed };
  } catch (e) {
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
      }, 'image/jpeg', 0.85);
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
          if (blob) resolve({ url: URL.createObjectURL(blob), blob });
          else reject(new Error("Thumbnail generation failed"));
          video.removeEventListener('seeked', onSeeked);
          URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.85);
      } catch (e) { reject(e); }
    };
    video.addEventListener('seeked', onSeeked);
    video.onerror = () => reject(new Error("Video load error"));
  });
};

export const uploadFileToStorage = (file: File, path: string, onProgress?: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!storage) {
      reject(new Error("Storage not configured"));
      return;
    }
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed', 
      (snapshot) => {
        const snapshotTotalBytes = snapshot.totalBytes || 1;
        const progress = (snapshot.bytesTransferred / snapshotTotalBytes) * 100;
        if (onProgress) onProgress(progress);
      }, 
      (error) => reject(error), 
      () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
    );
  });
};

export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  if (!db || !username) return true;
  try {
    const q = query(collection(db, COLLECTION_NAME), where("username", "==", username));
    const docs = await getDocs(q);
    return docs.empty;
  } catch (e) {
    return true;
  }
};

export const saveToDB = async (data: PortfolioData): Promise<void> => {
  if (!data.uid || data.uid === 'guest') return;
  const dataToSave = { ...data };
  delete dataToSave.profileImageBlob;
  delete dataToSave.showreelThumbnailBlob;
  delete dataToSave.showreelBlob;
  if (isConfigured && db) {
    await setDoc(doc(db, COLLECTION_NAME, data.uid), dataToSave);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
};

export const loadFromDB = async (identifier?: string): Promise<PortfolioData | null> => {
  if (isConfigured && db && identifier) {
    const docRef = doc(db, COLLECTION_NAME, identifier);
    let docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const q = query(collection(db, COLLECTION_NAME), where("username", "==", identifier));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) docSnap = querySnap.docs[0];
    }
    if (docSnap && docSnap.exists()) return docSnap.data() as PortfolioData;
  }
  return null;
};

export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth!, email, pass);
export const signupWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth!, email, pass);
export const loginWithGoogle = () => signInWithPopup(auth!, googleProvider!);
