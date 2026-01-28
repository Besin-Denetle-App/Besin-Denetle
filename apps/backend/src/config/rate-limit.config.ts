import { registerAs } from '@nestjs/config';

/**
 * Rate Limiting Configuration
 *
 * Limit tipleri:
 * - pool: Birden fazla endpoint aynı havuzu paylaşır
 * - endpoint: Tek endpoint için ek kısıtlama
 * - global: Saatlik/günlük toplam limitler
 * - auth: Kimlik doğrulama endpoint'leri için
 */
export default registerAs('rateLimit', () => ({
  // Redis bağlantı ayarları
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '50102', 10),
  },

  // ============================================
  // HAVUZ LİMİTLERİ (Dakikalık)
  // Birden fazla endpoint aynı havuzu paylaşır
  // ============================================
  pool: {
    // /products/scan + /products/reject
    scan_db: { limit: 12, ttlSeconds: 60 },
    scan_ai: { limit: 6, ttlSeconds: 60 },

    // /products/confirm + /content/reject
    content_db: { limit: 8, ttlSeconds: 60 },
    content_ai: { limit: 4, ttlSeconds: 60 },

    // /analysis/generate + /analysis/reject
    analysis_db: { limit: 8, ttlSeconds: 60 },
    analysis_ai: { limit: 4, ttlSeconds: 60 },
  },

  // ============================================
  // ENDPOINT LİMİTLERİ (Dakikalık)
  // Tek endpoint için ek kısıtlama
  // ============================================
  endpoint: {
    scan_reject: { limit: 3, ttlSeconds: 60 },
    content_reject: { limit: 3, ttlSeconds: 60 },
    analysis_reject: { limit: 3, ttlSeconds: 60 },
    flag: { limit: 1, ttlSeconds: 60 },
  },

  // ============================================
  // GLOBAL LİMİTLER (Saatlik/Günlük)
  // ============================================
  global: {
    total_db_hour: { limit: 180, ttlSeconds: 3600 },
    total_db_day: { limit: 360, ttlSeconds: 86400 },
    total_ai_hour: { limit: 90, ttlSeconds: 3600 },
    total_ai_day: { limit: 180, ttlSeconds: 86400 },
    total_reject_hour: { limit: 45, ttlSeconds: 3600 },
    total_reject_day: { limit: 90, ttlSeconds: 86400 },
  },

  // ============================================
  // AUTH LİMİTLERİ (IP veya User bazlı)
  // ============================================
  auth: {
    // IP bazlı (giriş yapmadan önce)
    oauth_ip: { limit: 5, ttlSeconds: 60 },
    email_signup_ip: { limit: 5, ttlSeconds: 60 },
    register_ip: { limit: 5, ttlSeconds: 60 },

    // User bazlı (giriş yaptıktan sonra)
    refresh_ip: { limit: 20, ttlSeconds: 60 },
    logout_user: { limit: 20, ttlSeconds: 60 },
    delete_user: { limit: 1, ttlSeconds: 3600 },
    restore_user: { limit: 2, ttlSeconds: 3600 },
  },

  // ============================================
  // HEALTH LİMİTLERİ (IP bazlı)
  // ============================================
  health: {
    check_ip: { limit: 3, ttlSeconds: 60 },
  },
}));
