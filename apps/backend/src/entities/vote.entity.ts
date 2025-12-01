import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { VariantSection1 } from './variant-section1.entity';
import { VariantSection2 } from './variant-section2.entity';
import { VoteType } from './vote-type.enum';

// Vote Entity - Kullanıcı oyları
@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string; // Google Auth'tan gelen kullanıcı ID

  @Column({ name: 'variant_section1_id', nullable: true })
  variantSection1Id: string | null;

  @Column({ name: 'variant_section2_id', nullable: true })
  variantSection2Id: string | null;

  @Column({
    type: 'enum',
    enum: VoteType,
    name: 'vote_type',
  })
  voteType: VoteType; // UPVOTE veya DOWNVOTE

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations - İlişkiler
  @ManyToOne(() => VariantSection1, (variant) => variant.votes, {
    nullable: true,
  })
  @JoinColumn({ name: 'variant_section1_id' })
  variantSection1: VariantSection1 | null;

  @ManyToOne(() => VariantSection2, (variant) => variant.votes, {
    nullable: true,
  })
  @JoinColumn({ name: 'variant_section2_id' })
  variantSection2: VariantSection2 | null;
}
