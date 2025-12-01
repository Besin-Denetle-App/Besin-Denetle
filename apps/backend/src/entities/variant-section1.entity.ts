import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

// VariantSection1 Entity - Ürün kimlik bilgileri (İsim, Marka, Görsel)
@Entity('variant_section1')
export class VariantSection1 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand: string | null;

  @Column({ nullable: true })
  image: string | null; // URL to the image

  @Column({ default: 0 })
  score: number; // Güven skoru

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations - İlişkiler
  @ManyToOne(() => Product, (product) => product.variantSection1s)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany('VariantSection2', (variant: any) => variant.variantSection1)
  variantSection2s: any[];

  @OneToMany('Vote', (vote: any) => vote.variantSection1)
  votes: any[];
}
