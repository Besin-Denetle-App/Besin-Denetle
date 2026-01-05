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
 * AI (Gemini) tarafından üretilen sağlık analizlerini sakladığımız tablo.
 * İçerik (ProductContent) değişirse analiz de değişmek zorundadır (Zincirleme reaksiyon).
 * Bu nedenle analizler doğrudan bir içerik varyantına bağlıdır.
 */
@Entity('content_analysis')
export class ContentAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Ait olduğu içerik varyantı
  @Column({ type: 'uuid' })
  @Index()
  product_content_id: string;

  @ManyToOne(() => ProductContent, (content) => content.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_content_id' })
  productContent: ProductContent;

  // AI tarafından üretilen analiz çıktısı (esnek JSONB yapı)
  @Column({ type: 'jsonb', nullable: true })
  analysis_text: IAnalysisResult | null;

  // Analiz varyantı puanı
  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  // Bu analize oy veren kullanıcı sayısı
  @Column({ type: 'int', default: 0 })
  vote_count: number;

  // AI mı manuel mi oluşturuldu
  @Column({ default: false })
  is_manual: boolean;

  // Oluşturulma tarihi
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => Vote, (vote) => vote.contentAnalysis)
  votes: Vote[];
}
