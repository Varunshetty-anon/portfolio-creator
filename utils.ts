import { PortfolioData, INITIAL_DATA } from './types';

const DB_NAME = 'CineFolioDB';
const DB_VERSION = 1;
const STORE_NAME = 'portfolio_store';

// Helper to encode state to Base64 for sharing via URL
export const encodeState = (data: PortfolioData): string => {
  try {
    // We create a clean copy without Blobs for sharing because Blobs can't be JSON stringified
    // and local blob URLs (blob:...) are useless to other users.
    const cleanProjects = data.projects.map(p => {
        const isLocal = p.link.startsWith('blob:');
        return {
            ...p,
            link: isLocal ? '' : p.link, // Remove local links
            thumbnailBlob: undefined,
            customVideoBlob: undefined
        };
    });
    
    const cleanData = {
        ...data,
        projects: cleanProjects,
        profileImageBlob: undefined,
        showreelThumbnailBlob: undefined
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
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to decode state", e);
    return null;
  }
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
        // When we load from DB, the string URLs (blob:...) are stale and invalid.
        // We must regenerate them from the stored Blob objects.
        const rehydratedData = { ...result };

        // Profile Image
        if (rehydratedData.profileImageBlob) {
            rehydratedData.profileImage = URL.createObjectURL(rehydratedData.profileImageBlob);
        }

        // Showreel Thumbnail
        if (rehydratedData.showreelThumbnailBlob) {
            rehydratedData.showreelThumbnail = URL.createObjectURL(rehydratedData.showreelThumbnailBlob);
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
