/**
 * Max varyant (Product, Content, Analysis)
 */
export const MAX_VARIANTS = 3;

/**
 * Geçici token (tempToken) geçerlilik süresi (milisaniye)
 */
export const TEMP_TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 Dakika

/**
 * AI çağrıları arası minimum bekleme süresi (milisaniye)
 */
export const AI_RATE_LIMIT_MS = 10 * 1000; // 10 Saniye

/**
 * Varsayılan ürün görseli
 */
export const DEFAULT_PRODUCT_IMAGE = "/images/placeholder-product.png";

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
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
  },
  PRODUCTS: {
    SCAN: "/api/products/scan",
    CONFIRM: "/api/products/confirm",
    REJECT: "/api/products/reject",
  },
  CONTENT: {
    REJECT: "/api/content/reject",
  },
  ANALYSIS: {
    REJECT: "/api/analysis/reject",
  },
} as const;
