import type { NutritionTable } from '@besin-denetle/shared';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ContentAnalysis } from './content-analysis.entity';
import { Product } from './product.entity';
import { Vote } from './vote.entity';

@Entity('product_contents')
export class ProductContent extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.contents)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  productId: string;

  /**
   * İçindekiler Listesi
   * Text formatında, virgülle ayrılmış içerik.
   */
  @Column('text', { nullable: true })
  ingredients: string;

  /**
   * Alerjen Bilgisi
   * Text formatında alerjen uyarıları.
   */
  @Column('text', { nullable: true })
  allergens: string;

  /**
   * Besin Değerleri Tablosu
   * JSONB formatında saklanır { calories, protein, sugar ... }
   */
  @Column('jsonb', { nullable: true })
  nutritionTable: NutritionTable;

  /**
   * Varyant Skoru
   * Kullanıcı oylarına göre artar/azalır. En yüksek skorlu varyant gösterilir.
   */
  @Column({ default: 0 })
  score: number;

  /**
   * Oy Veren Kişi Sayısı
   */
  @Column({ default: 0 })
  voteCount: number;

  @Column({ default: false })
  isManual: boolean;

  @OneToMany(() => ContentAnalysis, (analysis) => analysis.productContent)
  analyses: ContentAnalysis[];

  @OneToMany(() => Vote, (vote) => vote.productContent)
  votes: Vote[];
}
