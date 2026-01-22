import {
  AuthProvider,
  TEMP_TOKEN_EXPIRY_MS,
  UserRole,
} from '@besin-denetle/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppLogger } from '../../common';
import { User } from '../../entities';

// Kayıt süreci için geçici token verisi (RAM'de)
interface TempTokenData {
  provider: AuthProvider;
  providerId: string;
  email: string;
  expiresAt: number;
}

const tempTokenStore = new Map<string, TempTokenData>();

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number;
  private readonly googleClientId: string;
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly appLogger: AppLogger,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')!;
    this.jwtExpiresIn = 60 * 60 * 24 * 7; // 7 gün
    this.googleClientId =
      this.configService.get<string>('oauth.google.clientId') || '';

    this.googleClient = new OAuth2Client(this.googleClientId);

    if (!this.configService.get<string>('JWT_SECRET')) {
      this.appLogger.security(
        'JWT_SECRET not set, using dev fallback. DO NOT use in production!',
      );
    }

    if (!this.googleClientId) {
      this.appLogger.infrastructure(
        'OAuth client IDs not configured. Real OAuth will fail!',
      );
    }
  }

  /** OAuth doğrulama - kayıtlıysa JWT, değilse tempToken döner */
  async validateOAuth(
    provider: AuthProvider,
    token: string,
  ): Promise<{
    isNewUser: boolean;
    tempToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  }> {
    const oauthData = await this.verifyOAuthToken(provider, token);

    const existingUser = await this.userRepository.findOne({
      where: {
        auth_provider: provider,
        provider_id: oauthData.providerId,
      },
    });

    if (existingUser) {
      const tokens = this.generateTokens(existingUser);
      return {
        isNewUser: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: existingUser,
      };
    }

    // Yeni kullanıcı - tempToken oluştur
    const tempToken = uuidv4();
    tempTokenStore.set(tempToken, {
      provider,
      providerId: oauthData.providerId,
      email: oauthData.email,
      expiresAt: Date.now() + TEMP_TOKEN_EXPIRY_MS,
    });

    return {
      isNewUser: true,
      tempToken,
    };
  }

  /** E-posta ile kayıt/login (Beta test için) */
  async validateEmailSignup(email: string): Promise<{
    isNewUser: boolean;
    tempToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  }> {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: email.toLowerCase(),
        auth_provider: AuthProvider.EMAIL,
      },
    });

    if (existingUser) {
      const tokens = this.generateTokens(existingUser);
      this.appLogger.business('User login successful', {
        provider: 'email',
        emailDomain: email.split('@')[1],
      });
      return {
        isNewUser: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: existingUser,
      };
    }

    const providerId = `email_${email.toLowerCase()}`;
    const tempToken = uuidv4();

    tempTokenStore.set(tempToken, {
      provider: AuthProvider.EMAIL,
      providerId,
      email: email.toLowerCase(),
      expiresAt: Date.now() + TEMP_TOKEN_EXPIRY_MS,
    });

    this.appLogger.business('User registration started', {
      provider: 'email',
      emailDomain: email.split('@')[1],
    });

    return {
      isNewUser: true,
      tempToken,
    };
  }

  /** tempToken ile kayıt tamamla */
  async completeRegistration(
    tempToken: string,
    username: string,
    termsAccepted: boolean,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const tokenData = tempTokenStore.get(tempToken);

    if (!tokenData) {
      throw new UnauthorizedException(
        "Geçersiz veya süresi dolmuş kayıt token'ı",
      );
    }

    if (Date.now() > tokenData.expiresAt) {
      tempTokenStore.delete(tempToken);
      throw new UnauthorizedException("Kayıt token'ının süresi dolmuş");
    }

    if (!termsAccepted) {
      throw new UnauthorizedException('Kullanım şartlarını kabul etmelisiniz');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUsername) {
      throw new UnauthorizedException('Bu kullanıcı adı zaten kullanımda');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { email: tokenData.email },
    });

    if (existingEmail) {
      throw new UnauthorizedException(
        'Bu e-posta adresi başka bir hesapla ilişkili. Lütfen o hesapla giriş yapın.',
      );
    }

    try {
      const user = this.userRepository.create({
        username,
        email: tokenData.email,
        auth_provider: tokenData.provider,
        provider_id: tokenData.providerId,
        role: UserRole.USER,
        is_active: true,
      });

      await this.userRepository.save(user);
      tempTokenStore.delete(tempToken);

      const tokens = this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
      };
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
        'Registration failed',
        error instanceof Error ? error : new Error(String(error)),
        { provider: tokenData.provider },
      );
      throw error;
    }
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.jwtSecret,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException(
          'Kullanıcı bulunamadı veya aktif değil',
        );
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

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

  private generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: 60 * 60 * 24 * 365, // 1 yıl
    });

    return { accessToken, refreshToken };
  }

  private async verifyOAuthToken(
    provider: AuthProvider,
    token: string,
  ): Promise<{ providerId: string; email: string }> {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return this.verifyGoogleToken(token);
      default:
        throw new UnauthorizedException(
          `Desteklenmeyen OAuth sağlayıcısı: ${provider}`,
        );
    }
  }

  private async verifyGoogleToken(
    idToken: string,
  ): Promise<{ providerId: string; email: string }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });

      const payload: TokenPayload | undefined = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException(
          'Google token geçersiz veya eksik bilgi içeriyor',
        );
      }

      this.appLogger.business('OAuth verification successful', {
        provider: 'google',
        emailDomain: payload.email.split('@')[1],
      });

      return {
        providerId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      this.appLogger.error(
        'Google OAuth verification failed',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw new UnauthorizedException('Google token doğrulanamadı');
    }
  }
}
