import { VoteType } from '@besin-denetle/shared';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ContentAnalysis } from './content-analysis.entity';
import { ProductContent } from './product-content.entity';

@Entity('votes')
export class Vote extends BaseEntity {
  /**
   * Oy Veren Kullanıcı ID
   * Firebase/Google Auth ID'si tutulur.
   */
  @Column()
  userId: string; // Google Auth ID or similar

  @ManyToOne(() => ProductContent, (content) => content.votes, {
    nullable: true,
  })
  @JoinColumn({ name: 'product_content_id' })
  productContent: ProductContent;

  @Column({ nullable: true })
  productContentId: string;

  @ManyToOne(() => ContentAnalysis, (analysis) => analysis.votes, {
    nullable: true,
  })
  @JoinColumn({ name: 'content_analysis_id' })
  contentAnalysis: ContentAnalysis;

  @Column({ nullable: true })
  contentAnalysisId: string;

  /**
   * Oy Tipi
   * UP (Yukarı) veya DOWN (Aşağı)
   */
  @Column({
    type: 'enum',
    enum: VoteType,
  })
  voteType: VoteType;
}
