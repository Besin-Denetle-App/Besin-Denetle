import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductContent } from '../../../entities';
import { AiModule } from '../../ai/ai.module';
import { VoteModule } from '../../vote/vote.module';
import { ProductModule } from '../product/product.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

// Ürün içeriği - ingredients, allergens, besin değerleri
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductContent]),
    forwardRef(() => ProductModule),
    forwardRef(() => VoteModule),
    AiModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
