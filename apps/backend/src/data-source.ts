import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

// Root .env dosyasını yükle
config({ path: join(__dirname, '../../../.env') });

/**
 * TypeORM DataSource - Migration ve CLI için kullanılır
 *
 * Not: NestJS runtime'da ConfigModule üzerinden bağlanır.
 * Bu dosya sadece migration komutları için gereklidir.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '50103', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'besindenetle',
  entities: [join(__dirname, 'entities/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
  synchronize: false, // Migration kullanıyoruz
  logging: false,
});
