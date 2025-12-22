// Service Worker - Self Destruct Mode
// This script replaces any existing service worker to fix media playback and CORS issues.

self.addEventListener('install', (event) => {
  // Force this new SW to become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    self.clients.claim().then(() => {
        // Then immediately unregister to ensure no SW is controlling the page in the future
        return self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through: Do not call respondWith.
  // This ensures all requests go directly to the network.
  return;
});