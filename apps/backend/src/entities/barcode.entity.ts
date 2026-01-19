import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * Barkod entity
 * Benzersiz barkodların ana kaydı.
 */
@Entity('barcode')
export class Barcode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Barkod kodu (8690000123456)
  @Column({ unique: true })
  @Index()
  code: string;

  /**
   * Ürünün kategorisi:
   * 0: Kararsız durum
   * 1: Yiyecek
   * 2: İçecek
   * 3: Evcil Dostlar
   * 9: Kapsam dışı
   */
  @Column({ type: 'int', default: 0 })
  type: number;

  // Kaynak (true=manuel, false=AI)
  @Column({ default: false })
  is_manual: boolean;

  // Kullanıcılar tarafından raporlandı mı
  @Column({ default: false })
  @Index()
  is_flagged: boolean;

  // Bildirim sayısı
  @Column({ type: 'int', default: 0 })
  flag_count: number;

  // Oluşturulma
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => Product, (product) => product.barcode)
  products: Product[];
}
