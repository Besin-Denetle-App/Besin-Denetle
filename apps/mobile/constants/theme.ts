import { StyleSheet } from "react-native";

/**
 * Gölge stilleri - Platform bağımsız
 * iOS: shadow*, Android: elevation
 */
export const SHADOWS = StyleSheet.create({
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.62,
    elevation: 4,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  lg: {
    shadowColor: "#000",
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
    "2xl": 32,
    full: 9999,
  },

  // Spacing (padding/margin)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
  },
} as const;

/**
 * Renk sabitleri - Tailwind dışında kullanım için
 */
export const COLORS = {
  // Primary renk
  primary: "#8B5CF6", // Violet

  // Grays - Light mode renkleri
  light: {
    background: "#FAFAFA",
    foreground: "#212121",
    muted: "#757575",
    border: "#E0E0E0",
    card: "#FFFFFF",
    divider: "#D4D4D4",
  },

  // Grays - Dark mode renkleri
  dark: {
    background: "#121212",
    foreground: "#E0E0E0",
    muted: "#A0A0A0",
    border: "#2C2C2C",
    card: "#1E1E1E",
    divider: "#404040",
  },

  // Semantic renkler (Material Design 3 + Tailwind)
  semantic: {
    success: "#10B981", // Emerald-500
    successAlt: "#22C55E", // Green-500
    warning: "#F59E0B", // Amber-500
    warningAlt: "#EAB308", // Yellow-500
    error: {
      light: "#D32F2F", // Light modda error
      dark: "#EF5350", // Dark modda error
    },
    errorAlt: "#EF4444", // Red-500
    errorDanger: "#DC2626", // Red-600 (silme, ciddi uyarı)
    info: "#3B82F6", // Blue-500
  },

  // Eski semantic referanslar (geriye uyumluluk)
  success: "#10B981",
  warning: "#F59E0B",
  error: {
    light: "#D32F2F",
    dark: "#EF5350",
  },

  // System UI renkleri (edge-to-edge tasarım)
  systemUI: {
    light: {
      background: "#FAFAFA", // Status/Navigation bar arka plan
      foreground: "dark", // Siyah ikonlar
    },
    dark: {
      background: "#121212", // Status/Navigation bar arka plan
      foreground: "light", // Beyaz ikonlar
    },
  },
} as const;
