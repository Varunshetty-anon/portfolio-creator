// Service Worker - BYPASS MODE
// This worker explicitly does NOT handle fetch events to allow
// native browser handling of video streams and heavy assets.
// It also attempts to unregister itself to clear the scope.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
        // Attempt to unregister to stop controlling the page
        return self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Explicitly return nothing. 
  // This tells the browser: "The service worker is not handling this request."
  // The browser will then perform a standard network request.
  return;
});