import { PortfolioData, INITIAL_DATA } from './types';

// Helper to encode state to Base64 for sharing via URL
export const encodeState = (data: PortfolioData): string => {
  try {
    const json = JSON.stringify(data);
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

// Hook to check mode
export const getInitialState = (): { mode: 'edit' | 'view'; data: PortfolioData } => {
  const hash = window.location.hash;
  if (hash.startsWith('#view=')) {
    const encodedData = hash.replace('#view=', '');
    const decoded = decodeState(encodedData);
    if (decoded) {
      return { mode: 'view', data: decoded };
    }
  }
  
  // Try local storage for editor
  const saved = localStorage.getItem('cinefolio_data');
  if (saved) {
    try {
      return { mode: 'edit', data: JSON.parse(saved) };
    } catch(e) {}
  }

  return { mode: 'edit', data: INITIAL_DATA };
};