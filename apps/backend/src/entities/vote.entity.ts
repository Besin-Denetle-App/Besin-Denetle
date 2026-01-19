import { VoteType } from '@besin-denetle/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ContentAnalysis } from './content-analysis.entity';
import { ProductContent } from './product-content.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

/**
 * Topluluk oylamalarını kayıt altına alan tablo.
 * Bir kullanıcı bir veriye (Ürün, İçerik veya Analiz) sadece bir kez oy verebilir.
 * "Survival of the Fittest" (En iyinin hayatta kalması) mantığı bu tablo üzerinden yürür.
 */
@Entity('vote')
// Unique constraint'ler
@Unique('unique_user_product', ['user_id', 'product_id'])
@Unique('unique_user_content', ['user_id', 'product_content_id'])
@Unique('unique_user_analysis', ['user_id', 'content_analysis_id'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Oy veren
  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, (user) => user.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Oy tipi: UP veya DOWN
  @Column({
    type: 'enum',
    enum: VoteType,
  })
  vote_type: VoteType;

  // Ürün oylaması (nullable)
  @Column({ type: 'uuid', nullable: true })
  @Index()
  product_id: string | null;

  @ManyToOne(() => Product, (product) => product.votes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  // İçerik oylaması (nullable)
  @Column({ type: 'uuid', nullable: true })
  @Index()
  product_content_id: string | null;

  @ManyToOne(() => ProductContent, (content) => content.votes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'product_content_id' })
  productContent: ProductContent | null;

  // Analiz oylaması (nullable)
  @Column({ type: 'uuid', nullable: true })
  @Index()
  content_analysis_id: string | null;

  @ManyToOne(() => ContentAnalysis, (analysis) => analysis.votes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'content_analysis_id' })
  contentAnalysis: ContentAnalysis | null;

  // Oluşturulma
  @CreateDateColumn()
  created_at: Date;

  // Son güncelleme
  @UpdateDateColumn()
  updated_at: Date;
}
