import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { ProductsModule } from './products/products.module';
import { VariantsModule } from './variants/variants.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    ProductsModule,
    VariantsModule,
    VotesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
