import { AuthProvider } from '@besin-denetle/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../../common';
import { User } from '../../entities';
import { OAuthService } from './oauth.service';
import { TokenService } from './tokens/token.service';
import { UserService } from './user.service';

/** Auth işlemleri için ortak return type */
export type AuthResult = {
  isNewUser: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
};

/**
 * Ana kimlik doğrulama servisi.
 * OAuth ve TokenService'i orkestre eder.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly appLogger: AppLogger,
    private readonly oauthService: OAuthService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {
    if (!this.configService.get<string>('JWT_SECRET')) {
      this.appLogger.security(
        'JWT_SECRET not set, using dev fallback. DO NOT use in production!',
      );
    }
  }

  /**
   * Auth provider doğrulama - OAuth veya Email
   * Kayıtlıysa JWT, değilse tempToken döner
   */
  async validateProvider(
    provider: AuthProvider,
    credential: string,
  ): Promise<AuthResult> {
    const providerData = await this.oauthService.verifyToken(
      provider,
      credential,
    );

    const existingUser = await this.userService.findByProvider(
      provider,
      providerData.providerId,
    );

    if (existingUser) {
      const tokens = this.tokenService.generateTokens(existingUser);
      return {
        isNewUser: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: existingUser,
      };
    }

    // Provider ile bulunamadı - aynı email ile başka hesap var mı kontrol et
    const existingByEmail = await this.userService.findByEmail(
      providerData.email,
    );

    if (existingByEmail) {
      // Aynı email farklı provider ile kayıtlı
      const providerName = existingByEmail.auth_provider.toUpperCase();
      throw new UnauthorizedException(
        `Bu e-posta adresi ${providerName} hesabı ile kayıtlı. Lütfen ${providerName} ile giriş yapın.`,
      );
    }

    // Yeni kullanıcı - tempToken oluştur
    const tempToken = this.tokenService.createTempToken(
      provider,
      providerData.providerId,
      providerData.email,
    );

    return {
      isNewUser: true,
      tempToken,
    };
  }

  /** OAuth doğrulama - validateProvider'a yönlendir */
  async validateOAuth(
    provider: AuthProvider,
    token: string,
  ): Promise<AuthResult> {
    return this.validateProvider(provider, token);
  }

  /** E-posta ile kayıt/login - validateProvider'a yönlendir */
  async validateEmailSignup(email: string): Promise<AuthResult> {
    return this.validateProvider(AuthProvider.EMAIL, email);
  }

  /** tempToken ile kayıt tamamla */
  async completeRegistration(
    tempToken: string,
    username: string,
    termsAccepted: boolean,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const tokenData = this.tokenService.validateTempToken(tempToken);

    if (!termsAccepted) {
      throw new UnauthorizedException('Kullanım şartlarını kabul etmelisiniz');
    }

    // User creation userService'e devredildi
    const user = await this.userService.createUser(
      username,
      tokenData.email,
      tokenData.provider,
      tokenData.providerId,
    );

    this.tokenService.deleteTempToken(tempToken);
    const tokens = this.tokenService.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userService.findById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya aktif değil');
    }

    return this.tokenService.generateTokens(user);
  }
}
