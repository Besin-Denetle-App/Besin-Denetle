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
import { VariantSection1 } from './variant-section1.entity';

// VariantSection2 Entity - Beslenme bilgileri ve içerikler
@Entity('variant_section2')
export class VariantSection2 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'variant_section1_id' })
  variantSection1Id: string;

  @Column({ type: 'text', nullable: true })
  ingredients: string | null; // İçindekiler listesi

  @Column({ type: 'jsonb', nullable: true })
  nutritionTable: Record<string, any> | null; // Beslenme tablosu (JSONB)

  @Column({ default: 0 })
  score: number; // Güven skoru

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations - İlişkiler
  @ManyToOne(() => VariantSection1, (variant) => variant.variantSection2s)
  @JoinColumn({ name: 'variant_section1_id' })
  variantSection1: VariantSection1;

  @OneToMany('Vote', (vote: any) => vote.variantSection2)
  votes: any[];
}
