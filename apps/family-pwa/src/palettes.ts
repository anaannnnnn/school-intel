import type { Palette } from '@school-intel/ui';

// Colour themes for the student and parent workspace. Horizon follows the person's role (coral for
// students, amber for parents) and the device's light or dark setting.
export const FAMILY_PALETTES: Palette[] = [
  { id: 'horizon', name: 'Horizon', kit: 'Default · adapts to light and dark', swatch: ['#d1481f', '#f6f0e4', '#f4b942'], themeColor: '#14231f' },
  { id: 'pebble', name: 'Lavender', kit: 'Soft and playful', swatch: ['#6d5df6', '#f4f3ff', '#ffb4c8'], themeColor: '#6d5df6' },
  { id: 'night', name: 'Night', kit: 'Dark', swatch: ['#a99bff', '#130b2b', '#ff5fa2'], themeColor: '#130b2b' },
];
