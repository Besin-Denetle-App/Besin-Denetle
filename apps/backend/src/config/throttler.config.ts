import { registerAs } from '@nestjs/config';

/**
 * Rate Limiting (Throttler) konfigürasyonu.
 * IP ve User bazlı limitler ile endpoint grubu limitlerini tanımlar.
 */
export default registerAs('throttler', () => ({
  // Katman 1: IP bazlı (DDoS/CGNAT koruması)
  global: {
    ttl: 60000, // 1 dakika
    limit: 1000, // IP başına 1000 istek/dk
  },

  // Katman 2: User bazlı (genel üst sınır)
  user: {
    ttl: 60000,
    limit: 60, // User başına 60 istek/dk
  },

  // Endpoint bazlı limitler
  auth: {
    // Brute-force koruması için login/register
    login: { ttl: 60000, limit: 5 }, // 5/dk (IP bazlı)
    // Normal auth işlemleri
    other: { ttl: 60000, limit: 20 }, // 20/dk (User bazlı)
  },

  // Normal akış: scan + confirm | 20/dk
  confirm: {
    ttl: 60000,
    limit: 20, 
  },

  // Reject akışı: kötüye kullanımı engelle | 6/dk
  reject: {
    ttl: 60000,
    limit: 6, 
  },
}));
