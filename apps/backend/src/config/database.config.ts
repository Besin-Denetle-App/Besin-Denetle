import { registerAs } from '@nestjs/config';

/**
 * Veritabanı konfigürasyonu.
 * Environment variable'lardan okur.
 *
 * Zorunlu değişkenler env.validation.ts tarafından uygulama başlarken kontrol edilir:
 * DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */
export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    // Production'da synchronize kesinlikle kapalı (migration kullanılmalı)
    synchronize: !isProduction,
  };
});
