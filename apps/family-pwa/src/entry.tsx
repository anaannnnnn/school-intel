// Loaded on demand once a student or parent has signed in. Keeping the Pebble stylesheet in this chunk
// means it never loads for teachers, and the page reloads on sign-out so the two kits never mix.
import { applyPalette } from '@school-intel/ui';
import { App } from './App';
import { FAMILY_PALETTES } from './palettes';
import '@fontsource-variable/nunito';
import './family.css';

applyPalette('family', FAMILY_PALETTES);

export default App;
