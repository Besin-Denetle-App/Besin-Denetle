import { AuthProvider, UserRole } from '@besin-denetle/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../common';
import { User } from '../../entities';

/**
 * User DB işlemleri servisi.
 * User creation, validation ve deletion.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly appLogger: AppLogger,
  ) {}

  /** Username ve email uniqueness kontrolü (parallel query) */
  async validateUserUniqueness(username: string, email: string): Promise<void> {
    const [existingUsername, existingEmail] = await Promise.all([
      this.userRepository.findOne({ where: { username } }),
      this.userRepository.findOne({ where: { email } }),
    ]);

    if (existingUsername) {
      throw new UnauthorizedException('Bu kullanıcı adı zaten kullanımda');
    }

    if (existingEmail) {
      const providerName = existingEmail.auth_provider.toUpperCase();
      throw new UnauthorizedException(
        `Bu e-posta adresi ${providerName} hesabı ile kayıtlı. Lütfen ${providerName} ile giriş yapın.`,
      );
    }
  }

  /** Yeni user oluştur */
  async createUser(
    username: string,
    email: string,
    provider: AuthProvider,
    providerId: string,
  ): Promise<User> {
    // Uniqueness kontrolü
    await this.validateUserUniqueness(username, email);

    try {
      const user = this.userRepository.create({
        username,
        email,
        auth_provider: provider,
        provider_id: providerId,
        role: UserRole.USER,
        is_active: true,
      });

      await this.userRepository.save(user);
      return user;
    } catch (error: unknown) {
      const dbError = error as { code?: string; detail?: string };
      if (dbError.code === '23505') {
        if (dbError.detail?.includes('username')) {
          throw new UnauthorizedException('Bu kullanıcı adı zaten kullanımda');
        }
        if (dbError.detail?.includes('email')) {
          throw new UnauthorizedException(
            'Bu e-posta adresi başka bir hesapla ilişkili',
          );
        }
        if (dbError.detail?.includes('provider_id')) {
          throw new UnauthorizedException('Bu hesap zaten kayıtlı');
        }
      }
      this.appLogger.error(
        'User creation failed',
        error instanceof Error ? error : new Error(String(error)),
        { provider },
      );
      throw error;
    }
  }

  /** User ID ile kullanıcı bul */
  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  /** Provider bilgisi ile kullanıcı bul */
  async findByProvider(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        auth_provider: provider,
        provider_id: providerId,
      },
    });
  }

  /** Email ile kullanıcı bul */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /** Hesabı sil */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    this.appLogger.business('Account deletion started', {
      userId: user.id,
      username: user.username,
    });
    await this.userRepository.remove(user);
    this.appLogger.business('Account deleted', { userId: user.id });
  }
}
