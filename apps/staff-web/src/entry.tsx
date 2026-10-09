// Loaded on demand once a teacher or staff member has signed in (see apps/family-pwa/src/entry.tsx).
import { applyPalette } from '@school-intel/ui';
import { App } from './App';
import { STAFF_PALETTES } from './palettes';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource-variable/figtree';
import '@fontsource-variable/fraunces/full.css';
import './staff.css';
import '../../../packages/ui/src/horizon.css';
import './horizon.css';
import '../../../packages/ui/src/motion.css';

applyPalette('staff', STAFF_PALETTES);

export default App;
