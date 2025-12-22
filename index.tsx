import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// AGGRESSIVE SERVICE WORKER CLEANUP
// This is critical to fix CORS issues with Firebase Storage and Google Drive video playback.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((boolean) => {
          if (boolean) console.log('[Frames] Legacy Service Worker unregistered.');
      });
    }
  }).catch(console.error);
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element missing");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);