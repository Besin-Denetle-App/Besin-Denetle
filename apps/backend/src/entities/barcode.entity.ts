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
 * Barkod veritabanı modeli.
 * Sistemdeki her bir benzersiz barkodun ana kaydını burada tutuyoruz.
 * Ürünlerin varyantları bu tabloya ID ile bağlanıyor.
 */
@Entity('barcode')
export class Barcode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Barkod numarası (örn: 8690000123456)
  @Column({ unique: true })
  @Index()
  code: string;

  /**
   * Ürünün kategorisi (gıda, içecek vs.)
   * 0: Kararsız durum
   * 1: Yiyecek
   * 2: İçecek
   * 3: Evcil Dostlar
   * 9: Kapsam dışı
   */
  @Column({ type: 'int', default: 0 })
  type: number;

  // Bu kaydın kaynağı (true ise manuel, false ise AI tahmini)
  @Column({ default: false })
  is_manual: boolean;

  // Kullanıcılar tarafından "hatalı barkod" olarak raporlandı mı?
  @Column({ default: false })
  @Index()
  is_flagged: boolean;

  // Kaç kez bildirildi (önceliklendirme için)
  @Column({ type: 'int', default: 0 })
  flag_count: number;

  // Kaydın oluşturulma tarihi
  @CreateDateColumn()
  created_at: Date;

  // İlişkiler
  @OneToMany(() => Product, (product) => product.barcode)
  products: Product[];
}
