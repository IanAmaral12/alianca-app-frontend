import { Platform } from 'react-native';

export const palette = {
  accent: '#FDED00',
  accentDeep: '#101010',
  accentSoft: '#FFF7A3',
  border: '#2A2A2A',
  borderStrong: '#101010',
  card: '#FFFFFF',
  danger: '#D94A4A',
  gold: '#8A7A00',
  ink: '#111111',
  mist: '#F4F4EE',
  muted: '#5F5F55',
  primaryGlow: '#FFF7A3',
  success: '#2F8F57',
  surface: '#FFFDF4',
  surfaceAlt: '#F4F1E6',
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
  body: Platform.select({ android: 'sans-serif-medium', ios: 'DIN Next Rounded LT Pro', default: 'DIN Next Rounded LT Pro' }),
  heading: Platform.select({ android: 'sans-serif-black', ios: 'DIN Next Rounded LT Pro', default: 'DIN Next Rounded LT Pro' }),
};