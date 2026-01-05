import { INutritionTable } from '@besin-denetle/shared';
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
import { ContentAnalysis } from './content-analysis.entity';
import { Product } from './product.entity';
import { Vote } from './vote.entity';

/**
 * Ürünün "içindekiler" ve "besin değerleri" verisini tutan tablo.
 * AI, içeriği bazen farklı yorumlayabilir veya kullanıcılar düzeltmek isteyebilir.
 * Bu yüzden içeriği üründen ayrı bir tabloda tutarak varyantlaşmasına izin veriyoruz.
 */
@Entity('product_content')
export class ProductContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Ait olduğu ürün varyantı
  @Column({ type: 'uuid' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product, (product) => product.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Ürünün arka yüzündeki "İçindekiler" metni
  @Column({ type: 'text', nullable: true })
  ingredients: string | null;

  // Alerjen bilgisi (AI veya kullanıcı girişi) (örn: Gluten, Süt, Fındık içerir)
  @Column({ type: 'text', nullable: true })
  allergens: string | null;

  // Besin değerleri tablosu (JSON formatında)
  @Column({ type: 'jsonb', nullable: true })
  nutrition_table: INutritionTable | null;

  // İçerik varyantı puanı
  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  // Bu içeriğe oy veren kullanıcı sayısı
  @Column({ type: 'int', default: 0 })
  vote_count: number;

  // Verinin kaynağı (false: AI sonucu, true: manuel giriş)
  @Column({ default: false })
  is_manual: boolean;

  // Oluşturulma tarihi
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => ContentAnalysis, (analysis) => analysis.productContent)
  analyses: ContentAnalysis[];

  @OneToMany(() => Vote, (vote) => vote.productContent)
  votes: Vote[];
}
