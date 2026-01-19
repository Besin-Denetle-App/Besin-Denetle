import { AuthProvider, UserRole } from '@besin-denetle/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vote } from './vote.entity';

/**
 * Kullanıcı entity
 * OAuth (Google/Apple) girişi destekleniyor.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Username (unique)
  @Column({ unique: true })
  @Index()
  username: string;

  // E-posta (unique)
  @Column({ unique: true })
  @Index()
  email: string;

  // Auth provider: Google veya Apple
  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.GOOGLE,
  })
  auth_provider: AuthProvider;

  // OAuth provider ID
  @Column({ unique: true })
  @Index()
  provider_id: string;

  // Rol: User veya Admin
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  // Aktif mi
  @Column({ default: true })
  is_active: boolean;

  // Kayıt tarihi
  @CreateDateColumn()
  created_at: Date;

  // Son aktif
  @Column({ type: 'timestamp', nullable: true })
  last_active: Date | null;

  // İlişkiler
  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];
}
