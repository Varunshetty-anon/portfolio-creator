// Service Worker - EDITOR CONTEXT ONLY
// This worker must NOT handle video streams or portfolio public views.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. BYPASS ALL MEDIA REQUESTS (CRITICAL)
  // Browser must handle range requests for video natively.
  if (
    request.destination === 'video' ||
    request.destination === 'audio' ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.endsWith('.mov')
  ) {
    return; 
  }

  // 2. BYPASS FIREBASE STORAGE & DRIVE
  // Avoid CORS/Opaque response issues in SW.
  if (
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.hostname.includes('drive.google.com')
  ) {
    return;
  }

  // 3. BYPASS PUBLIC PORTFOLIO ROUTES
  // Ensure SW never inadvertently controls the public view.
  if (
    url.pathname.includes('/v/') ||
    (url.hash && url.hash.includes('/v/'))
  ) {
    return;
  }

  // Fallback: Let browser handle request naturally.
  // We do not implement caching strategies here to prevent conflicts.
  return;
});