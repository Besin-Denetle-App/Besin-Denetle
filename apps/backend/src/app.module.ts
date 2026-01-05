import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

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
import { ProductModule } from './modules/product';
import { VoteModule } from './modules/vote';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'myuser',
      password: process.env.DB_PASSWORD || 'mypassword',
      database: process.env.DB_NAME || 'besindenetle',
      entities: [Barcode, Product, ProductContent, ContentAnalysis, User, Vote],
      // Geliştirme (Dev) ortamında; entity dosyasında yaptığımız değişiklikleri otomatik olarak veritabanına yansıtır. 
      // ANCAK Production ortamında bu özellik kapalıdır çünkü yanlışlıkla veri kaybına sebep olabilir 
      // (örn. bir kolonu silersek içindeki veriler de gider). Production'da değişimler için "Migration" kullanıyoruz.
      synchronize: process.env.NODE_ENV !== 'production',
      logging: ['error'],
    }),
    // Modüller
    AuthModule,
    ProductModule,
    VoteModule,
    AiModule,
  ],
  providers: [
    // Bu Guard'ı global olarak kaydediyoruz.
    // Böylece her controller'ın tepesine tek tek @UseGuards() yazmamıza gerek kalmıyor.
    // Uygulamaya gelen her istek otomatik olarak bu güvenlik kontrolünden geçecek.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}



