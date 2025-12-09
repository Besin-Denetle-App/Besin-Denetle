import { BarcodeStatus } from '@besin-denetle/shared';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Product } from './product.entity';

@Entity('barcodes')
export class Barcode extends BaseEntity {
  /**
   * Barkod Numarası (EAN-13, EAN-8 vb.)
   * Unique (Eşsiz) olmalıdır.
   */
  @Column({ unique: true })
  code: string;

  /**
   * Barkod Durumu
   * 0=Pending (Bekliyor), 1=Active (Aktif/Besin), 2=Rejected (Besin Değil)
   */
  @Column({
    type: 'enum',
    enum: BarcodeStatus,
    default: BarcodeStatus.PENDING,
  })
  status: BarcodeStatus;

  /**
   * Kullanıcı Hata Bildirimi
   * True ise kullanıcılar bu barkodda hata olduğunu bildirmiştir.
   */
  @Column({ default: false })
  isFlagged: boolean;

  @OneToMany(() => Product, (product) => product.barcode)
  products: Product[];
}
