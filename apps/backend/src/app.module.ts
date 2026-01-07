import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';

// Common
import { HttpExceptionFilter, LoggingInterceptor } from './common';

// Config
import { createLoggerConfig, databaseConfig, jwtConfig, oauthConfig } from './config';

// Entity'ler
import {
  Barcode,
  ContentAnalysis,
  Product,
  ProductContent,
  User,
  Vote,
} from './entities';

// Modüller
import { AiModule } from './modules/ai';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health';
import { ProductModule } from './modules/product';
import { VoteModule } from './modules/vote';

@Module({
  imports: [
    // Winston logger (production'da dosyaya yazar, 50MB, 30 gün)
    WinstonModule.forRoot(createLoggerConfig()),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, oauthConfig],
    }),
    // API güvenliği için Rate Limiting ayarları (Brute-force koruması)
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000, // 1 saniye
          limit: 10, // Saniyede max 10 istek
        },
        {
          name: 'medium',
          ttl: 60000, // 1 dakika
          limit: 100, // Dakikada max 100 istek
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Barcode, Product, ProductContent, ContentAnalysis, User, Vote],
        synchronize: configService.get('database.synchronize'),
        logging: ['error'],
      }),
    }),
    // Modüller
    HealthModule,
    AuthModule,
    ProductModule,
    VoteModule,
    AiModule,
  ],
  providers: [
    // Global logging interceptor - tüm HTTP isteklerini loglar
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global exception filter - tüm hataları standart formatta döndürür
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global rate limiting guard - brute-force koruması
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}



