import { StyleSheet } from 'react-native';

/**
 * Gölge stilleri - Platform bağımsız shadow tanımları
 * iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * Android: elevation
 */
export const SHADOWS = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.62,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
});

/**
 * Boyut sabitleri
 */
export const SIZES = {
  // İkon boyutları
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },

  // Avatar/Resim boyutları
  avatar: {
    sm: 40,
    md: 64,
    lg: 96,
    xl: 128,
  },

  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
  },

  // Spacing (padding/margin)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
} as const;

/**
 * Renk sabitleri - Tailwind dışında kullanım için
 */
export const COLORS = {
  // Primary
  primary: '#8B5CF6', // Violet

  // Grays - Light mode
  light: {
    background: '#FAFAFA',
    foreground: '#212121',
    muted: '#757575',
    border: '#E0E0E0',
    card: '#FFFFFF',
  },

  // Grays - Dark mode
  dark: {
    background: '#121212',
    foreground: '#E0E0E0',
    muted: '#A0A0A0',
    border: '#2C2C2C',
    card: '#1E1E1E',
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: {
    light: '#D32F2F',
    dark: '#EF5350',
  },
} as const;
