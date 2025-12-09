import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from './ai/ai.module';
import { BarcodeModule } from './barcode/barcode.module';
import { Barcode } from './entities/barcode.entity';
import { ContentAnalysis } from './entities/content-analysis.entity';
import { ProductContent } from './entities/product-content.entity';
import { Product } from './entities/product.entity';
import { Vote } from './entities/vote.entity';
import { ProductsModule as ProductModule } from './products/products.module';
import { VotesModule as VoteModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'besin_denetle',
      entities: [Barcode, Product, ProductContent, ContentAnalysis, Vote],
      synchronize: true, // Development only
      logging: ['error'], 
    }),
    BarcodeModule,
    ProductModule,
    VoteModule,
    AiModule,
  ],
})
export class AppModule {}
