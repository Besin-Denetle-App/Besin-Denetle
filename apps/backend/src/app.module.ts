import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { VariantsModule } from './variants/variants.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [PrismaModule, ProductsModule, VariantsModule, VotesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
