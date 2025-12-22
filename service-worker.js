// Service Worker - Media Bypass Mode
// This script replaces any existing service worker.
// It forces immediate activation and then unregisters itself,
// while explicitly ignoring fetch events for media to prevent valid requests from being intercepted.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
        return self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRITICAL: Bypass all media and storage requests.
  // We return nothing (undefined) to let the browser handle the request natively.
  // This prevents the "ServiceWorker passed a promise... that rejected" error.
  if (
    event.request.destination === 'video' ||
    event.request.destination === 'audio' ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    url.hostname.includes('firebasestorage.googleapis.com')
  ) {
    return;
  }

  // Pass-through for everything else
  return;
});