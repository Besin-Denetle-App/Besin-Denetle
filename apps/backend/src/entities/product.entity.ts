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
import { Barcode } from './barcode.entity';
import { ProductContent } from './product-content.entity';
import { Vote } from './vote.entity';

/**
 * Ürün entity
 * Barkoda bağlı ürün varyantları.
 */
@Entity('product')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Bağlı barkod
  @Column({ type: 'uuid' })
  @Index()
  barcode_id: string;

  @ManyToOne(() => Barcode, (barcode) => barcode.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'barcode_id' })
  barcode: Barcode;

  // Marka
  @Column({ type: 'varchar', nullable: true })
  brand: string | null;

  // Ad
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  // Gramaj
  @Column({ type: 'varchar', nullable: true })
  quantity: string | null;

  // Görsel URL
  @Column({ type: 'varchar', nullable: true })
  image_url: string | null;

  // Skor
  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  // Oy sayısı
  @Column({ type: 'int', default: 0 })
  vote_count: number;

  // Kaynak (false=AI, true=admin)
  @Column({ default: false })
  is_manual: boolean;

  // Oluşturulma
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => ProductContent, (content) => content.product)
  contents: ProductContent[];

  @OneToMany(() => Vote, (vote) => vote.product)
  votes: Vote[];
}
