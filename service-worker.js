// Service Worker for Frames Portfolio
// Explicitly bypasses media files to fix playback issues and enable Range requests

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL: Bypass Firebase Storage and Media Files
  // We explicitly DO NOT call event.respondWith() for these requests.
  // This allows the browser to handle them natively.
  
  if (
    url.hostname.includes('firebasestorage') ||
    url.hostname.includes('googleapis') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.endsWith('.mov')
  ) {
    return; // Fall through to network
  }
});