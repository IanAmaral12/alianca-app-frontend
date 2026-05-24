import { Platform } from 'react-native';

export const palette = {
  accent: '#EA6F5A',
  accentDeep: '#14283A',
  accentSoft: '#FFE6DC',
  border: '#E8D8C6',
  borderStrong: '#CDB59C',
  card: '#FFFDFC',
  danger: '#AC4F60',
  gold: '#D0A15F',
  ink: '#1E2A35',
  mist: '#EEF3F7',
  muted: '#6C7683',
  primaryGlow: '#F4CBBE',
  success: '#3E7F5D',
  surface: '#F6EFE8',
  surfaceAlt: '#FDF7F2',
  white: '#FFFFFF',
};

export const radii = {
  lg: 28,
  md: 20,
  pill: 999,
  sm: 14,
};

export const spacing = {
  lg: 24,
  md: 16,
  sm: 12,
  xl: 36,
  xs: 6,
};

export const typography = {
  body: Platform.select({ android: 'sans-serif-medium', default: 'Avenir Next' }),
  heading: Platform.select({ android: 'serif', default: 'Didot' }),
};