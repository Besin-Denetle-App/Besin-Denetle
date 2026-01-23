import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';

import {
  HttpExceptionFilter,
  LastActiveInterceptor,
  LogContextInterceptor,
  LoggingInterceptor,
  LoggingModule,
  RateLimitModule,
} from './common';

import {
  aiConfig,
  createLoggerConfig,
  databaseConfig,
  jwtConfig,
  oauthConfig,
  rateLimitConfig,
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
import { CronModule } from './modules/cron';
import { HealthcheckModule } from './modules/healthcheck';
import { ScanModule } from './modules/scan';
import { VoteModule } from './modules/vote';

@Module({
  imports: [
    // Winston logger (production'da dosyaya yazar, 50MB, 30 gün)
    WinstonModule.forRoot(createLoggerConfig()),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      load: [aiConfig, databaseConfig, jwtConfig, oauthConfig, rateLimitConfig],
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
    HealthcheckModule,
    AuthModule,
    ScanModule,
    VoteModule,
    AiModule,
    CronModule,
    RateLimitModule,
    LoggingModule,
    // LastActiveInterceptor için User entity erişimi
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    // Global log context interceptor - request-scoped context
    {
      provide: APP_INTERCEPTOR,
      useClass: LogContextInterceptor,
    },
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
  ],
})
export class AppModule {}
