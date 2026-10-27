import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/i18n';
import App from './App.jsx';

// Active Service Worker Update Engine for instant Vercel/GitHub deployment syncing
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.update().catch(() => {});
    // Auto check for latest deployment every 30 seconds
    setInterval(() => {
      reg.update().catch(() => {});
    }, 30000);
  }).catch(() => {});

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // When new service worker takes over, reload to apply updates immediately!
    window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
