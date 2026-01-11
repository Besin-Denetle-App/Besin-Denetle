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
 * Ürün varyantlarını temsil eden tablomuz.
 * Bir barkoda bağlı birden fazla ürün kaydı olabilir (örn. farklı kullanıcılar farklı bilgiler girebilir).
 * Oylama sistemi ile en doğru varyantı öne çıkarıyoruz.
 */
@Entity('product')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Bağlı olduğu barkod
  @Column({ type: 'uuid' })
  @Index()
  barcode_id: string;

  @ManyToOne(() => Barcode, (barcode) => barcode.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barcode_id' })
  barcode: Barcode;

  // Ürün markası (örn: Eti)
  @Column({ type: 'varchar', nullable: true })
  brand: string | null;

  // Ürün adı (örn: Çikolatalı Gofret)
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  // Miktar/gramaj bilgisi (örn: 500g, 1L)
  @Column({ type: 'varchar', nullable: true })
  quantity: string | null;

  // Ürün görseli URL'i
  @Column({ type: 'varchar', nullable: true })
  image_url: string | null;

  // Varyantın güvenilirlik puanı (Kullanıcı oylarına göre dinamik değişir)
  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  // Bu varyanta oy veren toplam kullanıcı sayısı
  @Column({ type: 'int', default: 0 })
  vote_count: number;

  // Kayıt tipi (false: AI üretimi, true: admin girişi)
  @Column({ default: false })
  is_manual: boolean;

  // Varyantın oluşturulma tarihi
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => ProductContent, (content) => content.product)
  contents: ProductContent[];

  @OneToMany(() => Vote, (vote) => vote.product)
  votes: Vote[];
}
