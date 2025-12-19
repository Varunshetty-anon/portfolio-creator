import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Aggressively unregister any existing service workers immediately
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Service Worker unregistered');
      }).catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
    }
  }).catch((error) => {
    console.error('Error getting service worker registrations:', error);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);