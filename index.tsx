import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// SERVICE WORKER MANAGEMENT
// Critical: The Service Worker must NOT control the public portfolio page.
// It interferes with video streaming from Firebase Storage.
if ('serviceWorker' in navigator) {
  // Check for public portfolio route pattern (both Path and Hash routing)
  const isPublicRoute = window.location.pathname.includes('/v/') || window.location.hash.includes('#/v/');

  if (isPublicRoute) {
    // FORCE UNREGISTER ON PORTFOLIO
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then(() => {
           console.log('[Frames] SW Unregistered for playback stability.');
        });
      }
    }).catch((err) => {
       console.warn('[Frames] SW Unregister failed:', err);
    });
  } else {
    // REGISTER ONLY FOR EDITOR
    // Using relative path to avoid "not a valid URL" errors in some environments
    navigator.serviceWorker.register('./service-worker.js', { scope: '/' })
      .then((reg) => {
        console.log('[Frames] Editor SW Registered:', reg.scope);
      })
      .catch((err) => {
        // Log but do not crash
        console.warn('[Frames] SW Registration skipped/failed:', err);
      });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element missing");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);