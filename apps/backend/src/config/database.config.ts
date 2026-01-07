import { registerAs } from '@nestjs/config';

/**
 * Veritabanı konfigürasyonu.
 * Environment variable'lardan okur, varsayılan değerler sağlar.
 */
export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'besindenetle',
  synchronize: process.env.NODE_ENV !== 'production',
}));
