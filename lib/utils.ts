import { PortfolioData, PortfolioContent, UserProfile, PortfolioMeta, INITIAL_DATA, Project } from '../types';
import { db, storage, auth, googleProvider, isConfigured } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, addDoc, serverTimestamp, increment, writeBatch, getDocsFromServer, getDocFromServer, DocumentSnapshot, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword, User, deleteUser, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
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

export const PROJECT_CONTENT_TYPES = [
    "Brand Trailer",
    "Ad / Promotional Spot",
    "Music Video", 
    "Short Film", 
    "Documentary", 
    "Social Media Content", 
    "Corporate", 
    "Wedding", 
    "Gaming", 
    "Vlog",
    "Showreel",
    "Other"
];

export const PROJECT_SUBJECT_MATTERS = [
    "Beauty & Fashion", 
    "Tech", 
    "Lifestyle", 
    "Automotive", 
    "Travel", 
    "Sports", 
    "Narrative", 
    "Education",
    "Real Estate",
    "Food & Beverage",
    "Other"
];

// --- Helpers ---

export const getAspectRatioFromDims = (w: number, h: number): '16:9' | '9:16' | '4:3' | '1:1' => {
  if (!w || !h) return '16:9';
  const ratio = w / h;
  if (ratio >= 1.5) return '16:9'; 
  if (ratio <= 0.85) return '9:16'; 
  if (ratio > 0.85 && ratio < 1.15) return '1:1'; 
  return '4:3'; 
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

export const extractGoogleDriveId = (url: string): string | null => {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

// Convert storage URLs to direct streams
export const getDirectVideoUrl = (url: string): string => {
  if (!url) return '';
  // Dropbox
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
  }
  // Google Drive Logic REMOVED: We want Drive links to remain as is, 
  // so they fall through to the iframe embed logic in PortfolioView.
  return url;
};

// Check if URL is native streamable
export const isNativeVideo = (url: string): boolean => {
  if (!url) return false;
  const u = url.toLowerCase();
  // REMOVED: u.includes('drive.google.com/uc?export=download')
  // Google Drive is NOT a native video source. It must be embedded via iframe.
  return (
    u.includes('firebasestorage') ||
    u.includes('dl.dropboxusercontent.com') ||
    u.endsWith('.mp4') ||
    u.endsWith('.webm') ||
    u.endsWith('.mov')
  );
};

export const getDriveThumbnail = (url: string): string | null => {
  const id = extractGoogleDriveId(url);
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

export const getVideoMetadata = async (url: string): Promise<{ thumbnail: string | null, aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' }> => {
    let thumbnail = null;
    let aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' = '16:9';
    
    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            thumbnail = getYouTubeThumbnail(url);
            try {
                const res = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.width && data.height) {
                        aspectRatio = getAspectRatioFromDims(data.width, data.height);
                    }
                }
            } catch (e) {
                aspectRatio = '16:9';
            }
        } 
        else if (url.includes('vimeo.com')) {
            try {
                const res = await fetch(`https://vimeo.com/api/oembed.json?url=${url}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.thumbnail_url) thumbnail = data.thumbnail_url;
                    if (data.width && data.height) {
                        aspectRatio = getAspectRatioFromDims(data.width, data.height);
                    }
                }
            } catch (e) {
                aspectRatio = '16:9';
            }
        }
        else if (url.includes('drive.google.com')) {
            thumbnail = getDriveThumbnail(url);
            if (thumbnail) {
                try {
                    const dims = await probeImageDimensions(thumbnail);
                    aspectRatio = getAspectRatioFromDims(dims.width, dims.height);
                } catch (e) {
                    console.warn("Drive thumbnail probe failed", e);
                }
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
  
  if (!content.albums) content.albums = [];

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
  
  // Cache check disabled for debugging / ensuring fresh fetches if needed
  // const cached = portfolioCache.get(cleanSlug);
  // if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
  //     return cached.data;
  // }

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
  
  const result: PortfolioData = { ...INITIAL_DATA, ...content, uid, meta, stats: { views: 0, clicks: 0 } };
  
  portfolioCache.set(cleanSlug, { data: result, timestamp: Date.now() });
  return result;
};

// REALTIME PUBLIC SUBSCRIPTION
export const subscribeToPublicPortfolio = (slug: string, onData: (data: PortfolioData | null) => void) => {
    if (!db) {
        console.warn("Database not initialized, cannot subscribe.");
        return () => {};
    }
    const cleanSlug = slug.toLowerCase();
    const q = query(collection(db, PORTFOLIOS_COL), where("slug", "==", cleanSlug));
    
    return onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
            onData(null);
            return;
        }
        
        // Handle case where multiple docs might match (shouldn't happen with unique constraint)
        const docSnap = snapshot.docs[0]; 
        const meta = docSnap.data() as PortfolioMeta;
        const uid = docSnap.id;
        
        // Strict check: Must be explicitly published and have a live version
        if (!meta.publish?.isPublished || !meta.publish?.liveVersion) {
            onData(null);
            return;
        }

        try {
            const vRef = doc(db, PORTFOLIOS_COL, uid, VERSIONS_COL, meta.publish.liveVersion);
            
            // We use getDoc here because versions are immutable snapshots.
            // The Firestore Rule ensures we can only read if it matches liveVersion.
            const vSnap = await getDoc(vRef);
            
            if (vSnap.exists()) {
                 const content = vSnap.data() as PortfolioContent;
                 // Merge with INITIAL_DATA to ensure new fields (like aiTools) don't break the UI
                 onData({ ...INITIAL_DATA, ...content, uid, meta });
            } else {
                 console.error(`Live version ${meta.publish.liveVersion} not found for user ${uid}`);
                 onData(null);
            }
        } catch (e) {
            console.error("Failed to load portfolio version:", e);
            onData(null);
        }
    }, (error) => {
        console.error("Real-time subscription error:", error);
        onData(null);
    });
};


export const ensureUserProfile = async (user: User): Promise<UserProfile> => {
    if (!db) throw new Error("Database not initialized");
    try { await user.getIdToken(true); } catch (e) {}
    const userRef = doc(db, USERS_COL, user.uid);
    let profile: UserProfile | null = null;
    try {
        const snap = await withTimeout(getDoc(userRef), 5000, "Read profile timeout") as DocumentSnapshot;
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

export const trackPortfolioview = async (uid: string) => {
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
    let contentType = file.type || 'application/octet-stream';
    const lowerPath = path.toLowerCase();
    
    if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (lowerPath.endsWith('.png')) contentType = 'image/png';
    else if (lowerPath.endsWith('.webp')) contentType = 'image/webp';
    else if (lowerPath.endsWith('.mp4') || file.type === 'video/mp4') contentType = 'video/mp4';
    else if (lowerPath.endsWith('.mov')) contentType = 'video/quicktime';

    const metadata: any = {
        contentType: contentType,
    };

    // CRITICAL: Force MP4 Metadata for showreels and video files
    if (contentType === 'video/mp4') {
        metadata.cacheControl = 'public,max-age=31536000';
    } else {
        metadata.cacheControl = 'public, max-age=31536000';
    }

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
    
    // Create a local URL for the file
    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;
    
    const timeout = setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
        reject(new Error("Video load timeout"));
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

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
          URL.revokeObjectURL(fileUrl);
          return reject(new Error("Canvas failure"));
      }
      
      ctx.drawImage(video, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(fileUrl);
        if (blob) resolve({ url: URL.createObjectURL(blob), blob, aspectRatio });
        else reject(new Error("Blob failure"));
      }, 'image/jpeg', 0.85);
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.onerror = () => { 
        clearTimeout(timeout); 
        URL.revokeObjectURL(fileUrl);
        reject(new Error("Video load error")); 
    };
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
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error("Network error");
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    window.open(url, '_blank');
  }
};

export const loginWithEmail = (e: string, p: string) => signInWithEmailAndPassword(auth!, e, p);
export const signupWithEmail = (e: string, p: string) => createUserWithEmailAndPassword(auth!, e, p);

export const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase Auth not initialized correctly");
    
    try {
        await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
        console.warn("Persistence setting failed, continuing with session:", e);
    }

    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(auth, googleProvider);
};

export const loginWithGoogleRedirect = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase Auth not initialized correctly");
    try {
        await setPersistence(auth, browserLocalPersistence);
    } catch (e) {}
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithRedirect(auth, googleProvider);
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

export const trackPortfolioView = trackPortfolioview;