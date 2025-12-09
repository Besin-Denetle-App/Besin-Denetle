import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ProductContent } from './product-content.entity';
import { Vote } from './vote.entity';

@Entity('content_analyses')
export class ContentAnalysis extends BaseEntity {
  @ManyToOne(() => ProductContent, (content) => content.analyses)
  @JoinColumn({ name: 'product_content_id' })
  productContent: ProductContent;

  @Column()
  productContentId: string;

  /**
   * AI veya Kullanıcı Yorumu
   * "Bu ürün şeker içerir", "Besin değeri düşük" gibi analiz metni.
   */
  @Column('text')
  analysisText: string;

  /**
   * Analiz Skoru
   * Kullanıcı oylarına göre belirlenir.
   */
  @Column({ default: 0 })
  score: number;

  /**
   * Oy Sayısı
   */
  @Column({ default: 0 })
  voteCount: number;

  @Column({ default: false })
  isManual: boolean;

  @OneToMany(() => Vote, (vote) => vote.contentAnalysis)
  votes: Vote[];
}
