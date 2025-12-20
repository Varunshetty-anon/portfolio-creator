// Service Worker for Frames Portfolio
// Explicitly bypasses media files to fix playback issues

self.addEventListener('install', (event) => {
  // Activate immediately to replace any existing broken service workers
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL: Bypass Firebase Storage, Google Drive, Dropbox, and Media Files
  // We explicitly DO NOT call event.respondWith() for these requests.
  // This allows the browser to handle them natively, ensuring:
  // 1. Range headers are sent correctly (vital for video seeking/streaming)
  // 2. CORS checks are handled by the browser's media stack
  // 3. 206 Partial Content responses are processed correctly
  
  if (
    url.hostname.includes('firebasestorage') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firebaseio') ||
    url.hostname.includes('drive.google.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('dropbox.com') ||
    url.hostname.includes('dropboxusercontent.com') ||
    url.pathname.match(/\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i)
  ) {
    return; // Fall through to network
  }

  // For other requests, we currently fall through to network as well.
  // This acts as a pass-through Service Worker for now.
});