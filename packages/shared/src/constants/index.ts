/**
 * Constants - barrel export
 */
export * from "./error-codes";

/**
 * Max varyant (Product, Content, Analysis)
 */
export const MAX_VARIANTS = 3;

/**
 * Geçici token (tempToken) geçerlilik süresi (milisaniye)
 */
export const TEMP_TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 Dakika

/**
 * Score değişimi
 */
export const SCORE_CHANGES = {
  NEW_UP: 1, // Yeni UP oyu
  NEW_DOWN: -1, // Yeni DOWN oyu
  UP_TO_DOWN: -2, // UP'tan DOWN'a değişim
  DOWN_TO_UP: 2, // DOWN'dan UP'a değişim
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    OAUTH: "/api/auth/oauth",
    EMAIL_SIGNUP: "/api/auth/email-signup",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
  },
  PRODUCTS: {
    SCAN: "/api/products/scan",
    CONFIRM: "/api/products/confirm",
    REJECT: "/api/products/reject",
  },
  BARCODES: {
    FLAG: "/api/barcodes/flag",
  },
  CONTENT: {
    REJECT: "/api/content/reject",
  },
  ANALYSIS: {
    GENERATE: "/api/analysis/generate",
    REJECT: "/api/analysis/reject",
  },
} as const;
