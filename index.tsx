import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// CRITICAL: Cleanup any lingering Service Workers that might break media streaming or cause "Invalid State" errors.
// This is essential for environments like sandboxed iframes.
if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
            .then(() => console.debug('[Frames] SW Unregistered'))
            .catch(() => {});
        }
      })
      .catch((err) => {
        // Suppress expected errors in restricted environments
        if (!err.message?.includes('invalid state') && err.name !== 'InvalidStateError') {
          console.warn('[Frames] Service Worker check error:', err.message);
        }
      });
  } catch (e) {
    // Silent catch for catastrophic environment failures
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element missing");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);