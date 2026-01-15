import { registerAs } from '@nestjs/config';

/**
 * Veritabanı konfigürasyonu.
 * Environment variable'lardan okur.
 *
 * Production'da zorunlu değişkenler:
 * - DB_HOST
 * - DB_USER
 * - DB_PASSWORD
 * - DB_NAME
 */
export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Production'da kritik değişkenler zorunlu
  if (isProduction) {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Production ortamında zorunlu environment variable'lar eksik: ${missing.join(', ')}`,
      );
    }
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
    database: process.env.DB_NAME || 'besindenetle',
    // Production'da synchronize kesinlikle kapalı (migration kullanılmalı)
    synchronize: !isProduction,
  };
});
