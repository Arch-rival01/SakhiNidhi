import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/i18n';
import App from './App.jsx';

// Auto-reload when PWA service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
