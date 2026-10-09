import type { Palette } from '@school-intel/ui';

// Colour themes for the teacher and staff workspace. Horizon is the default and follows the device's
// light or dark setting.
export const STAFF_PALETTES: Palette[] = [
  { id: 'horizon', name: 'Horizon', kit: 'Default · adapts to light and dark', swatch: ['#1d7a6c', '#f6f0e4', '#f4b942'], themeColor: '#14231f' },
  { id: 'ledger', name: 'Ledger', kit: 'Clinical teal', swatch: ['#0f7c7a', '#f5f8f9', '#2e5bff'], themeColor: '#0f7c7a' },
  { id: 'night', name: 'Night', kit: 'Dark · Vector', swatch: ['#3cc2b4', '#0a0b0d', '#5b8cff'], themeColor: '#0a0b0d' },
];
