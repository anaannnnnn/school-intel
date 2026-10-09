// Loaded on demand once a student or parent has signed in. Keeping this stylesheet in its own chunk
// means it never loads for teachers, and the page reloads on sign-out so the two workspaces never mix.
import { applyPalette } from '@school-intel/ui';
import { App } from './App';
import { FAMILY_PALETTES } from './palettes';
import '@fontsource-variable/nunito';
import '@fontsource-variable/figtree';
import '@fontsource-variable/fraunces/full.css';
import './family.css';
import '../../../packages/ui/src/horizon.css';
import './horizon.css';

applyPalette('family', FAMILY_PALETTES);

export default App;
