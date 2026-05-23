// Sense Health — Typography System
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System', // Uses SF Pro on iOS natively
  android: 'sans-serif', // Uses Roboto, or we can load Inter later
  default: 'System',
});

export const Typography = {
  // Display
  displayLarge: {
    fontFamily,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.3,
  },

  // Headings
  h1: {
    fontFamily,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: 0,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0,
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28, // Increased for breathing space
    letterSpacing: 0.1,
  },
  body: {
    fontFamily,
    fontSize: 16, // Better readability
    fontWeight: '400',
    lineHeight: 24, // Increased breathing space
    letterSpacing: 0.1,
  },
  bodySmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Labels
  label: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Caption
  caption: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.2,
  },

  // Button
  button: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // Number displays
  number: {
    fontFamily,
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 52,
    letterSpacing: -1,
  },
  numberMedium: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  numberSmall: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16, // Increased
  lg: 20, // Increased
  xl: 28, // Increased
  xxl: 36, // Increased
  xxxl: 48, // Increased
  section: 56, // Increased
};

export const Radius = {
  sm: 12,
  md: 16,
  lg: 24, // More rounded cards
  xl: 32,
  xxl: 40,
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  large: {
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 8,
  },
};

export default { Typography, Spacing, Radius, Shadows };
