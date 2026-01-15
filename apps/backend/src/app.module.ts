import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';

import {
    HttpExceptionFilter,
    LastActiveInterceptor,
    LoggingInterceptor,
    UserThrottlerGuard,
} from './common';

// Config
import {
    createLoggerConfig,
    databaseConfig,
    jwtConfig,
    oauthConfig,
    throttlerConfig,
} from './config';

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
      load: [databaseConfig, jwtConfig, oauthConfig, throttlerConfig],
    }),
    // API güvenliği için Rate Limiting ayarları
    // Katman 1: IP bazlı global limit (DDoS/CGNAT koruması)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: configService.get<number>('throttler.global.ttl') || 60000,
            limit: configService.get<number>('throttler.global.limit') || 1000,
          },
        ],
      }),
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
        entities: [
          Barcode,
          Product,
          ProductContent,
          ContentAnalysis,
          User,
          Vote,
        ],
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
    // LastActiveInterceptor için User entity erişimi
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    // Global logging interceptor - tüm HTTP isteklerini loglar
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Last active interceptor - authenticated kullanıcıların last_active tarihini günceller
    {
      provide: APP_INTERCEPTOR,
      useClass: LastActiveInterceptor,
    },
    // Global exception filter - tüm hataları standart formatta döndürür
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global rate limiting guard - brute-force koruması
    // Authenticated: user ID bazlı, Anonymous: IP bazlı
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
