// Service Worker - Self Destruct Mode
// This script replaces any existing service worker to fix media playback and CORS issues.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Immediately unregister to relinquish control
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      clients.forEach(client => {
        // Notify clients or reload if strictly necessary, 
        // but for now we just want to stop interfering.
        console.log('[Frames] Service Worker self-destructed. Page should work on next load.');
      });
    });
});

self.addEventListener('fetch', (event) => {
  // Pass-through: Do not call respondWith.
  // This ensures all requests go directly to the network.
  return;
});