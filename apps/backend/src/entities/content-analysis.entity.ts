import { IAnalysisResult } from '@besin-denetle/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductContent } from './product-content.entity';
import { Vote } from './vote.entity';

/**
 * AI (Gemini) tarafından üretilen sağlık analizlerinin saklandığı dosya.
 * İçerik (ProductContent) değişirse analiz de değişmek zorunda.
 * Bu nedenle analizler doğrudan bir içerik varyantına bağlıdır.
 */
@Entity('content_analysis')
export class ContentAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Bağlı içerik
  @Column({ type: 'uuid' })
  @Index()
  product_content_id: string;

  @ManyToOne(() => ProductContent, (content) => content.analyses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_content_id' })
  productContent: ProductContent;

  // AI analiz çıktısı (JSONB)
  @Column({ type: 'jsonb', nullable: true })
  analysis_text: IAnalysisResult | null;

  // Kullanılan AI model adı (örn: gemini-3-pro-preview)
  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  // Skor
  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  // Bu analize oy veren kullanıcı sayısı
  @Column({ type: 'int', default: 0 })
  vote_count: number;

  // Kaynak
  @Column({ default: false })
  is_manual: boolean;

  // Oluşturulma
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => Vote, (vote) => vote.contentAnalysis)
  votes: Vote[];
}
