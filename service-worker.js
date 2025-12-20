// SELF-DESTRUCTING SERVICE WORKER
// This script replaces any existing service worker to fix video playback issues.

self.addEventListener('install', (event) => {
  // Force this new worker to become the active one immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 1. Take control of all open pages immediately
  event.waitUntil(self.clients.claim());
  
  // 2. Unregister this service worker to prevent future interference
  self.registration.unregister().then(() => {
    console.log('Service Worker: Unregistered to fix video streaming.');
  });
});

// IMPORTANT: No 'fetch' event listener.
// This ensures all network requests fall through to the browser's native network stack,
// allowing range requests and streaming to work correctly with Firebase Storage.
