import { PortfolioData, PortfolioContent, UserProfile, PortfolioMeta, INITIAL_DATA, Project } from '../types';
import { db, storage, auth, googleProvider, isConfigured } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, addDoc, serverTimestamp, increment, writeBatch, getDocsFromServer, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, User, deleteUser, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";

const USERS_COL = 'users';
const PORTFOLIOS_COL = 'portfolios';
const VERSIONS_COL = 'versions';
const ANALYTICS_COL = 'analytics';

export { isConfigured, auth };
export const hasCloudStorage = !!storage;

// --- Helper for Timeouts ---
const withTimeout = <T>(promise: Promise<T>, ms: number = 10000, errorMsg: string = "Request timed out"): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
        promise.then(
            (res) => { clearTimeout(timer); resolve(res); },
            (err) => { clearTimeout(timer); reject(err); }
        );
    });
};

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

// --- Helpers ---

export const getAspectRatioFromDims = (w: number, h: number): '16:9' | '9:16' | '4:3' | '1:1' => {
  if (!w || !h) return '16:9';
  const ratio = w / h;
  if (ratio >= 1.6) return '16:9'; // Covers 16:9, 21:9
  if (ratio <= 0.8) return '9:16'; // Covers 9:16
  if (ratio >= 1.2 && ratio <= 1.5) return '4:3'; // Covers 4:3
  return '1:1'; // Covers 1:1 and others
};

export const probeImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Image probe failed"));
    img.src = url;
  });
};

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

export const getDriveThumbnail = (url: string): string | null => {
  const id = getDriveId(url);
  // Public proxy for thumbnails
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1000` : null;
};

export const getStoragePathFromUrl = (url: string): string | null => {
    try {
        if (!url || !url.includes('firebasestorage.googleapis.com')) return null;
        const decoded = decodeURIComponent(url);
        const regex = /\/o\/([^?]+)/;
        const match = decoded.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
}

// Unified Metadata Fetcher for External Links
export const getVideoMetadata = async (url: string): Promise<{ thumbnail: string | null, aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' }> => {
    let thumbnail = null;
    let aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' = '16:9';

    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            thumbnail = getYouTubeThumbnail(url);
            try {
                const res = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
                const data = await res.json();
                if (data.width && data.height) {
                    aspectRatio = getAspectRatioFromDims(data.width, data.height);
                }
            } catch (e) {}
        } 
        else if (url.includes('drive.google.com')) {
            thumbnail = getDriveThumbnail(url);
            if (thumbnail) {
                try {
                    // Drive thumbnails usually preserve aspect ratio of the video
                    const dims = await probeImageDimensions(thumbnail);
                    aspectRatio = getAspectRatioFromDims(dims.width, dims.height);
                } catch (e) {}
            }
        }
    } catch (e) {
        console.error("Metadata fetch failed", e);
    }

    return { thumbnail, aspectRatio };
}

// --- Core Database Logic ---

export const saveDraft = async (uid: string, data: PortfolioData): Promise<void> => {
  if (!uid || !db) return;
  const contentToSave: Partial<PortfolioContent> = { ...data };
  delete (contentToSave as any).uid;
  delete (contentToSave as any).settings;
  delete (contentToSave as any).meta;
  delete (contentToSave as any).stats;

  const draftRef = doc(db, PORTFOLIOS_COL, uid, VERSIONS_COL, 'draft');
  await setDoc(draftRef, { ...contentToSave, updatedAt: serverTimestamp() });

  const portfolioRef = doc(db, PORTFOLIOS_COL, uid);
  await setDoc(portfolioRef, {
    ownerUid: uid,
    slug: data.username || data.settings?.username || 'user',
  }, { merge: true });
};

export const publishPortfolio = async (uid: string, data: PortfolioData): Promise<void> => {
  if (!uid || !db) return;
  await saveDraft(uid, data);
  const draftRef = doc(db, PORTFOLIOS_COL, uid, VERSIONS_COL, 'draft');
  const draftSnap = await getDoc(draftRef);
  if (!draftSnap.exists()) throw new Error("No draft found to publish");

  const draftData = draftSnap.data();
  const versionsRef = collection(db, PORTFOLIOS_COL, uid, VERSIONS_COL);
  const newVersionDoc = await addDoc(versionsRef, {
    ...draftData,
    publishedAt: serverTimestamp(),
    isSnapshot: true
  });

  const portfolioRef = doc(db, PORTFOLIOS_COL, uid);
  await setDoc(portfolioRef, {
    publish: {
      isPublished: true,
      liveVersion: newVersionDoc.id,
      publishedAt: serverTimestamp()
    },
    slug: data.username 
  }, { merge: true });
};

export const cleanupUnusedMedia = async (uid: string, currentData?: any): Promise<number> => {
    if (!db || !storage || !uid) return 0;
    const protectedPaths = new Set<string>();
    const addProtected = (url: string | undefined) => {
        const path = getStoragePathFromUrl(url || '');
        if (path) protectedPaths.add(path);
    };
    const collectFromContent = (data: any) => {
        if (!data) return;
        addProtected(data.profileImage);
        addProtected(data.showreelLink);
        addProtected(data.showreelThumbnail); 
        if (Array.isArray(data.projects)) {
            data.projects.forEach((p: any) => {
                addProtected(p.thumbnail);
                if (p.link) addProtected(p.link);
            });
        }
    };

    try {
        if (currentData) collectFromContent(currentData);
        const draftSnap = await getDoc(doc(db, PORTFOLIOS_COL, uid, VERSIONS_COL, 'draft'));
        if (draftSnap.exists()) collectFromContent(draftSnap.data());
        const metaSnap = await getDoc(doc(db, PORTFOLIOS_COL, uid));
        if (metaSnap.exists()) {
            const meta = metaSnap.data() as PortfolioMeta;
            if (meta.publish?.liveVersion) {
                const liveSnap = await getDoc(doc(db, PORTFOLIOS_COL, uid, VERSIONS_COL, meta.publish.liveVersion));
                if (liveSnap.exists()) collectFromContent(liveSnap.data());
            }
        }
        const userRootRef = ref(storage, `users/${uid}`);
        const getAllFiles = async (rootRef: any): Promise<any[]> => {
            let files: any[] = [];
            const res = await listAll(rootRef);
            files = [...files, ...res.items];
            for (const folder of res.prefixes) {
                const folderFiles = await getAllFiles(folder);
                files = [...files, ...folderFiles];
            }
            return files;
        };
        const allFiles = await getAllFiles(userRootRef);
        const filesToDelete = allFiles.filter(fileRef => !protectedPaths.has(fileRef.fullPath));
        await Promise.all(filesToDelete.map(fileRef => deleteObject(fileRef).catch(e => {
            console.warn(`Failed to delete ${fileRef.fullPath}`, e);
        })));
        return filesToDelete.length;
    } catch (e) {
        console.error("Cleanup failed:", e);
        return 0;
    }
};

export const loadEditorState = async (uid: string): Promise<PortfolioData | null> => {
  if (!db) return null;
  const draftRef = doc(db, PORTFOLIOS_COL, uid, VERSIONS_COL, 'draft');
  const draftSnap = await getDoc(draftRef);
  const portfolioRef = doc(db, PORTFOLIOS_COL, uid);
  const portfolioSnap = await getDoc(portfolioRef);
  const meta = portfolioSnap.exists() ? portfolioSnap.data() as PortfolioMeta : undefined;
  
  let content = INITIAL_DATA;
  if (draftSnap.exists()) {
    content = { ...content, ...(draftSnap.data() as PortfolioContent) };
  }
  return {
    ...content,
    uid,
    settings: {
        username: meta?.slug || content.username,
        password: ""
    },
    meta,
  };
};

const portfolioCache = new Map<string, { data: PortfolioData, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; 

export const loadPublicPortfolio = async (slug: string): Promise<PortfolioData | null> => {
  if (!db) return null;
  const cleanSlug = slug.toLowerCase();
  const cached = portfolioCache.get(cleanSlug);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
  }
  const q = query(collection(db, PORTFOLIOS_COL), where("slug", "==", cleanSlug));
  let querySnap;
  try {
      querySnap = await getDocsFromServer(q);
  } catch (e) {
      querySnap = await getDocs(q);
  }
  if (querySnap.empty) return null;
  const portfolioDoc = querySnap.docs[0];
  const meta = portfolioDoc.data() as PortfolioMeta;
  const uid = portfolioDoc.id;
  if (!meta.publish?.isPublished || !meta.publish?.liveVersion) return null;
  const versionId = meta.publish.liveVersion;
  const versionRef = doc(db, PORTFOLIOS_COL, uid, VERSIONS_COL, versionId);
  let versionSnap;
  try {
      versionSnap = await getDocFromServer(versionRef);
  } catch (e) {
      versionSnap = await getDoc(versionRef);
  }
  if (!versionSnap.exists()) return null;
  const content = versionSnap.data() as PortfolioContent;
  const result: PortfolioData = { ...content, uid, meta, stats: { views: 0, clicks: 0 } };
  portfolioCache.set(cleanSlug, { data: result, timestamp: Date.now() });
  return result;
};

export const ensureUserProfile = async (user: User): Promise<UserProfile> => {
    if (!db) throw new Error("Database not initialized");
    try { await user.getIdToken(true); } catch (e) {}
    const userRef = doc(db, USERS_COL, user.uid);
    let profile: UserProfile | null = null;
    try {
        const snap = await withTimeout(getDoc(userRef), 5000, "Read profile timeout");
        if (snap.exists()) profile = snap.data() as UserProfile;
    } catch (e) {}
    if (profile) return profile;
    const newProfile: UserProfile = { uid: user.uid, email: user.email || '', onboarded: false, createdAt: Date.now() };
    try { await withTimeout(setDoc(userRef, newProfile, { merge: true }), 5000, "Create profile timeout"); return newProfile; } 
    catch (e) { throw new Error("Failed to initialize account data."); }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!db) return null;
    const snap = await getDoc(doc(db, USERS_COL, uid));
    return snap.exists() ? snap.data() as UserProfile : null;
}

export const completeOnboarding = async (uid: string, initialData: PortfolioData) => {
    if (!db) return;
    const userRef = doc(db, USERS_COL, uid);
    await setDoc(userRef, { onboarded: true, createdAt: Date.now() }, { merge: true });
    await saveDraft(uid, initialData);
}

export const trackPortfolioView = async (uid: string) => {
    if (!db || !uid) return;
    try {
        const storageKey = `frames_view_${uid}`;
        if (localStorage.getItem(storageKey)) return;
        localStorage.setItem(storageKey, 'true');
        const statsRef = doc(db, 'portfolio_stats', uid);
        await setDoc(statsRef, { views: increment(1), lastViewed: serverTimestamp() }, { merge: true });
    } catch (e) {}
};

export const trackPortfolioClick = async (uid: string, type: string) => {
    if (!db || !uid) return;
    try {
        const storageKey = `frames_click_${uid}_${type}`;
        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, 'true');
        const statsRef = doc(db, 'portfolio_stats', uid);
        await setDoc(statsRef, { clicks: increment(1) }, { merge: true });
    } catch (e) {}
};

export const getPortfolioStats = async (uid: string): Promise<{ views: number; clicks: number }> => {
    if (!db || !uid) return { views: 0, clicks: 0 };
    try {
        const statsRef = doc(db, 'portfolio_stats', uid);
        const snap = await getDoc(statsRef);
        return snap.exists() ? (snap.data() as any) : { views: 0, clicks: 0 };
    } catch (e) { return { views: 0, clicks: 0 }; }
};

export const uploadFileToStorage = (file: File, path: string, onProgress?: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!storage) return reject(new Error("Storage not configured"));
    
    const storageRef = ref(storage, path);
    
    // Determine content type with strict overrides for video files to ensure streaming works
    let contentType = file.type || 'application/octet-stream';
    const lowerPath = path.toLowerCase();
    
    // Force correct MIME types based on extension to avoid "application/octet-stream"
    // which causes playback/download issues in some browsers
    if (lowerPath.endsWith('.mp4')) contentType = 'video/mp4';
    else if (lowerPath.endsWith('.webm')) contentType = 'video/webm';
    else if (lowerPath.endsWith('.mov')) contentType = 'video/quicktime';
    else if (lowerPath.endsWith('.m4v')) contentType = 'video/mp4';
    else if (lowerPath.endsWith('.ogg')) contentType = 'video/ogg';
    else if (lowerPath.endsWith('.avi')) contentType = 'video/x-msvideo';
    else if (lowerPath.endsWith('.mkv')) contentType = 'video/x-matroska';
    else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (lowerPath.endsWith('.png')) contentType = 'image/png';
    else if (lowerPath.endsWith('.webp')) contentType = 'image/webp';

    // CRITICAL: Explicitly set content type and cache control for video streaming
    // cacheControl: public, max-age=31536000 (1 year) allows the browser and CDN to cache the video,
    // reducing partial content requests and improving seeking performance.
    const metadata = {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000'
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

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

export const generateThumbnailFromVideo = (file: File): Promise<{ url: string; blob: Blob; aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;
    video.src = URL.createObjectURL(file);
    
    const timeout = setTimeout(() => reject(new Error("Video load timeout")), 8000);

    video.onloadedmetadata = () => {
        // Seek to random point to avoid black frame, or 1s
        let seekTime = Math.min(1, video.duration * 0.25);
        if (!isFinite(seekTime)) seekTime = 0;
        video.currentTime = seekTime;
    };
    
    const onSeeked = () => {
      clearTimeout(timeout);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = getAspectRatioFromDims(width, height);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas failure"));
      
      ctx.drawImage(video, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve({ url: URL.createObjectURL(blob), blob, aspectRatio });
        else reject(new Error("Blob failure"));
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.85);
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.onerror = () => { clearTimeout(timeout); reject(new Error("Video load error")); };
  });
};

export const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<Blob> => {
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
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
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
  const q = query(collection(db, PORTFOLIOS_COL), where("slug", "==", username.toLowerCase()));
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

export const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase Auth not initialized correctly");
    await setPersistence(auth, browserLocalPersistence);
    return await signInWithPopup(auth, googleProvider);
};

export const deletePortfolioFromDB = async (uid: string) => {
  if (!db || !storage || !uid) return;
  try {
      const versionsRef = collection(db, PORTFOLIOS_COL, uid, VERSIONS_COL);
      const versionsSnap = await getDocs(versionsRef);
      const batch = writeBatch(db);
      versionsSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
  } catch(e) {}
  await deleteDoc(doc(db, PORTFOLIOS_COL, uid));
  await deleteDoc(doc(db, USERS_COL, uid));
  await deleteDoc(doc(db, 'portfolio_stats', uid));
  try {
     const recursiveDelete = async (folderRef: any) => {
        const list = await listAll(folderRef);
        await Promise.all(list.items.map(item => deleteObject(item)));
        await Promise.all(list.prefixes.map(prefix => recursiveDelete(prefix)));
     };
     await recursiveDelete(ref(storage, `users/${uid}`));
  } catch (e) {}
};

export const deleteUserAuth = async () => {
  if (auth?.currentUser) await deleteUser(auth.currentUser);
};