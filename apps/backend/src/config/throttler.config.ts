import { registerAs } from '@nestjs/config';

/**
 * Rate Limiting (Throttler) konfigürasyonu.
 * IP ve User bazlı limitler ile endpoint grubu limitlerini tanımlar.
 *
 * Kullanım: Controller'larda @Throttle decorator'ı ile
 * import { THROTTLE_CONFIRM, THROTTLE_REJECT } from '../../config';
 * @Throttle(THROTTLE_CONFIRM)
 */

// ============== SABIT DEĞERLER (Controller'larda kullanılır) ==============

/** Genel istek limiti - scan, confirm gibi normal akışlar için */
export const THROTTLE_CONFIRM = { default: { limit: 20, ttl: 60000 } };

/** Reject akışı - AI maliyeti yüksek, kötüye kullanımı engelle */
export const THROTTLE_REJECT = { default: { limit: 6, ttl: 60000 } };

/** Auth işlemleri - brute-force koruması */
export const THROTTLE_AUTH = { default: { limit: 5, ttl: 60000 } };

/** Normal auth işlemleri - refresh, logout */
export const THROTTLE_AUTH_NORMAL = { default: { limit: 20, ttl: 60000 } };

/** Flag işlemi */
export const THROTTLE_FLAG = { default: { limit: 5, ttl: 60000 } };

/** Health check - Public olduğu için kısıtlı (50sn'de 1) */
export const THROTTLE_HEALTH = { default: { limit: 1, ttl: 50000 } };

// ============== CONFIG SERVICE İÇİN (app.module.ts) ==============

export default registerAs('throttler', () => ({
  // IP bazlı global limit
  global: {
    ttl: 60000, // 1 dakika
    limit: 1000, // 1000 istek/dk
  },
}));
