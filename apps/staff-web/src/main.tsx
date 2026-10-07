import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyPalette } from '@school-intel/ui';
import { App } from './App';
import { STAFF_PALETTES } from './palettes';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './staff.css';

applyPalette('staff', STAFF_PALETTES);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
