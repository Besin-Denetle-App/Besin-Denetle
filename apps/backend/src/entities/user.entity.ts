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
 * Kullanıcı bilgilerini tuttuğumuz tablomuz.
 * Sadece OAuth (Google/Apple) girişi destekliyoruz, şifre tutmuyoruz.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Kullanıcı adı (benzersiz)
  @Column({ unique: true })
  @Index()
  username: string;

  // E-posta adresi (benzersiz)
  @Column({ unique: true })
  @Index()
  email: string;

  // Hangi servis ile giriş yaptı?
  // Kimlik sağlayıcı: Google veya Apple
  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.GOOGLE,
  })
  auth_provider: AuthProvider;

  // OAuth servisinden dönen unique ID
  @Column({ unique: true })
  @Index()
  provider_id: string;

  // Kullanıcı rolü: User veya Admin
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  // Hesap aktif mi?
  @Column({ default: true })
  is_active: boolean;

  // Kayıt tarihi
  @CreateDateColumn()
  created_at: Date;

  // Son çevrimiçi olma tarihi (her authenticated istekte güncellenir)
  @Column({ type: 'timestamp', nullable: true })
  last_active: Date | null;

  // İlişkiler
  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];
}
