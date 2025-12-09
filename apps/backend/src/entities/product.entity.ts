import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Barcode } from './barcode.entity';
import { ProductContent } from './product-content.entity';

@Entity('products')
export class Product extends BaseEntity {
  @ManyToOne(() => Barcode, (barcode) => barcode.products)
  @JoinColumn({ name: 'barcode_id' })
  barcode: Barcode;

  @Column()
  barcodeId: string;

  /**
   * Ürün Markası
   */
  @Column({ nullable: true })
  brand: string;

  /**
   * Ürün Adı
   */
  @Column()
  name: string;

  /**
   * Miktar / Gramaj (örn: 500g, 1L)
   */
  @Column({ nullable: true })
  quantity: string;

  /**
   * Veri Kaynağı
   * False = AI tarafından oluşturuldu
   * True = Kullanıcı manuel girdi
   */
  @Column({ default: false })
  isManual: boolean;

  /**
   * Hata Bildirimi
   * True = Kullanıcılar bu üründe hata bildirdi
   */
  @Column({ default: false })
  isFlagged: boolean;

  @OneToMany(() => ProductContent, (content) => content.product)
  contents: ProductContent[];
}
