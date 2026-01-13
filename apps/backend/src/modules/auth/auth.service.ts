import {
  AuthProvider,
  TEMP_TOKEN_EXPIRY_MS,
  UserRole,
} from '@besin-denetle/shared';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
// import appleSignin from 'apple-signin-auth';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities';

// Geçici token deposu.
// Yeni kayıt sürecinde kullanıcı bilgilerini kısa süreliğine RAM'de tutmak için kullanılır.
// Production ortamında burası Redis gibi bir cache sistemine taşınmalıdır.
interface TempTokenData {
  provider: AuthProvider;
  providerId: string;
  email: string;
  expiresAt: number;
}

const tempTokenStore = new Map<string, TempTokenData>();

/**
 * Kullanıcı kimlik doğrulama işlemlerini yöneten servis.
 * OAuth (Google/Apple) doğrulama, JWT üretimi ve yeni kayıt (TempToken) süreçlerini kapsar.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isMockMode: boolean;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number;
  private readonly googleClientId: string;
  // private readonly appleClientId: string;
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.isMockMode = this.configService.get<string>('MOCK_AUTH') === 'true';
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') || 'dev-secret-key';
    this.jwtExpiresIn = 60 * 60 * 24 * 7; // 7 gün (saniye)
    this.googleClientId =
      this.configService.get<string>('oauth.google.clientId') || '';
    // this.appleClientId = this.configService.get<string>('oauth.apple.clientId') || '';

    // Google OAuth client (sadece gerçek modda kullanılır)
    this.googleClient = new OAuth2Client(this.googleClientId);

    if (this.isMockMode) {
      this.logger.warn('Auth Service running in MOCK MODE');
    }

    // Production uyarısı: JWT_SECRET set edilmemişse
    if (!this.configService.get<string>('JWT_SECRET')) {
      this.logger.warn(
        '⚠️ JWT_SECRET not set, using dev fallback. DO NOT use in production!',
      );
    }

    // OAuth client ID kontrolü
    if (!this.isMockMode && !this.googleClientId /* && !this.appleClientId */) {
      this.logger.warn(
        '⚠️ OAuth client IDs not configured. Real OAuth will fail!',
      );
    }
  }

  /**
   * OAuth sağlayıcısından gelen token'ı doğrular.
   * Eğer kullanıcı kayıtlıysa JWT döner, değilse kayıt tamamlamak için geçici token (TempToken) üretir.
   */
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
    // OAuth token'ı doğrula ve kullanıcı bilgilerini al
    const oauthData = await this.verifyOAuthToken(provider, token);

    // Mevcut kullanıcı var mı kontrol et
    const existingUser = await this.userRepository.findOne({
      where: {
        auth_provider: provider,
        provider_id: oauthData.providerId,
      },
    });

    if (existingUser) {
      // Kullanıcı mevcut - JWT üret ve döndür
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

  /**
   * E-posta ile kayıt/login (Beta test için)
   * Kayıtlı kullanıcı varsa JWT döner, yoksa tempToken ile kayıt akışı başlatır
   */
  async validateEmailSignup(email: string): Promise<{
    isNewUser: boolean;
    tempToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  }> {
    // E-posta ile kayıtlı kullanıcı var mı kontrol et
    const existingUser = await this.userRepository.findOne({
      where: {
        email: email.toLowerCase(),
        auth_provider: AuthProvider.EMAIL,
      },
    });

    if (existingUser) {
      // Kullanıcı mevcut - JWT üret ve döndür
      const tokens = this.generateTokens(existingUser);
      this.logger.debug(`E-posta ile login başarılı: ${email}`);
      return {
        isNewUser: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: existingUser,
      };
    }

    // Yeni kullanıcı - tempToken oluştur
    // provider_id olarak e-posta hash'i kullanıyoruz
    const providerId = `email_${email.toLowerCase()}`;
    const tempToken = uuidv4();

    tempTokenStore.set(tempToken, {
      provider: AuthProvider.EMAIL,
      providerId,
      email: email.toLowerCase(),
      expiresAt: Date.now() + TEMP_TOKEN_EXPIRY_MS,
    });

    this.logger.debug(`E-posta ile yeni kayıt başlatıldı: ${email}`);

    return {
      isNewUser: true,
      tempToken,
    };
  }

  /**
   * Kayıt tamamla (tempToken ile)
   */
  async completeRegistration(
    tempToken: string,
    username: string,
    termsAccepted: boolean,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // tempToken doğrula
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

    // Kullanıcı adı kontrolü
    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUsername) {
      throw new UnauthorizedException('Bu kullanıcı adı zaten kullanımda');
    }

    // Kullanıcı oluştur
    const user = this.userRepository.create({
      username,
      email: tokenData.email,
      auth_provider: tokenData.provider,
      provider_id: tokenData.providerId,
      role: UserRole.USER,
      is_active: true,
    });

    await this.userRepository.save(user);

    // tempToken sil
    tempTokenStore.delete(tempToken);

    // JWT üret
    const tokens = this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    };
  }

  /**
   * JWT yenileme
   */
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

  /**
   * Kullanıcı ID'ye göre bul
   */
  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * JWT token üret
   */
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
      expiresIn: 60 * 60 * 24 * 365, // 1 yıl (saniye)
    });

    return { accessToken, refreshToken };
  }

  /**
   * OAuth token doğrulama (mock veya gerçek)
   */
  private async verifyOAuthToken(
    provider: AuthProvider,
    token: string,
  ): Promise<{ providerId: string; email: string }> {
    // Mock mod aktifse, her zaman mock kullan
    if (this.isMockMode) {
      return this.mockVerifyOAuthToken(provider, token);
    }

    // Gerçek OAuth doğrulama
    switch (provider) {
      case AuthProvider.GOOGLE:
        return this.verifyGoogleToken(token);
      // case AuthProvider.APPLE:
      //   return this.verifyAppleToken(token);
      default:
        throw new UnauthorizedException(
          `Desteklenmeyen OAuth sağlayıcısı: ${provider}`,
        );
    }
  }

  /**
   * Google ID Token doğrulama
   * Frontend'den gelen idToken'u Google API ile doğrular.
   */
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

      this.logger.debug(`Google OAuth doğrulama başarılı: ${payload.email}`);

      return {
        providerId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      this.logger.error(
        `Google OAuth doğrulama hatası: ${(error as Error).message}`,
      );
      throw new UnauthorizedException('Google token doğrulanamadı');
    }
  }

  /**
   * Apple Identity Token doğrulama
   * Frontend'den gelen identityToken'u Apple public key ile doğrular.
   */
  /*
  private async verifyAppleToken(identityToken: string): Promise<{ providerId: string; email: string }> {
    try {
      const appleUser = await appleSignin.verifyIdToken(identityToken, {
        audience: this.appleClientId,
        ignoreExpiration: false,
      });

      if (!appleUser.sub) {
        throw new UnauthorizedException('Apple token geçersiz veya eksik bilgi içeriyor');
      }

      // Apple ilk girişte email verir, sonraki girişlerde vermeyebilir
      const email = appleUser.email || `${appleUser.sub}@privaterelay.appleid.com`;

      this.logger.debug(`Apple OAuth doğrulama başarılı: ${email}`);

      return {
        providerId: appleUser.sub,
        email,
      };
    } catch (error) {
      this.logger.error(`Apple OAuth doğrulama hatası: ${(error as Error).message}`);
      throw new UnauthorizedException('Apple token doğrulanamadı');
    }
  }
  */

  /**
   * Mock OAuth doğrulama
   */
  private mockVerifyOAuthToken(
    provider: AuthProvider,
    token: string,
  ): { providerId: string; email: string } {
    this.logger.debug(`[MOCK] Verifying OAuth token for provider: ${provider}`);

    // Token'dan mock kullanıcı bilgisi oluştur
    const mockId = `mock_${provider}_${token.slice(0, 8)}`;
    const mockEmail = `${token.slice(0, 8)}@mock.${provider}.com`;

    return {
      providerId: mockId,
      email: mockEmail,
    };
  }
}
