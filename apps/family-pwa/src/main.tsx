import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyPalette } from '@school-intel/ui';
import { App } from './App';
import { FAMILY_PALETTES } from './palettes';
import '@fontsource-variable/nunito';
import './family.css';

applyPalette('family', FAMILY_PALETTES);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline shell only: the service worker caches static assets, never student
// records or case data (PRD §18 mobile resilience).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  });
}
