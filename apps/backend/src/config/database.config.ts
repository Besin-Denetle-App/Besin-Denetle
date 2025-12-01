import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Product, VariantSection1, VariantSection2, Vote } from '../entities';

// TypeORM Database Konfigürasyonu
// Docker compose'da tanımlı PostgreSQL bağlantı ayarları
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'besindenetle',
  entities: [Product, VariantSection1, VariantSection2, Vote],
  synchronize: process.env.NODE_ENV !== 'production', // Production'da false olmalı
  logging: process.env.NODE_ENV === 'development',
};
