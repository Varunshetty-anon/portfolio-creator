// Service Worker - Self Destruct Mode
// This script replaces any existing service worker.
// It forces immediate activation and then unregisters itself.

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
  // Pass-through: Do not call respondWith.
  // This ensures all requests go directly to the network.
  return;
});