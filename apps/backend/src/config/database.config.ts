import { registerAs } from '@nestjs/config';

/**
 * Veritabanı konfigürasyonu
 */
export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    // Production'da synchronize kapalı
    synchronize: !isProduction,
  };
});
