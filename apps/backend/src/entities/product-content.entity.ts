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
 * Ürün içerik entity
 * İçindekiler ve besin değerleri.
 */
@Entity('product_content')
export class ProductContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Bağlı ürün
  @Column({ type: 'uuid' })
  @Index()
  product_id: string;

  @ManyToOne(() => Product, (product) => product.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // İçindekiler metni
  @Column({ type: 'text', nullable: true })
  ingredients: string | null;

  // Alerjen bilgisi
  @Column({ type: 'text', nullable: true })
  allergens: string | null;

  // Besin tablosu (JSONB)
  @Column({ type: 'jsonb', nullable: true })
  nutrition_table: INutritionTable | null;

  // Skor
  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  // Oy sayısı
  @Column({ type: 'int', default: 0 })
  vote_count: number;

  // Kaynak (false=AI, true=manuel)
  @Column({ default: false })
  is_manual: boolean;

  // Oluşturulma
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => ContentAnalysis, (analysis) => analysis.productContent)
  analyses: ContentAnalysis[];

  @OneToMany(() => Vote, (vote) => vote.productContent)
  votes: Vote[];
}
