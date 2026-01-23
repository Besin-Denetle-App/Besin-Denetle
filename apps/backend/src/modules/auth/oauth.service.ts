import { AuthProvider } from '@besin-denetle/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { AppLogger } from '../../common';

export interface OAuthUserData {
  providerId: string;
  email: string;
}

/**
 * OAuth sağlayıcıları ile token doğrulama servisi.
 * Google ve Apple Sign In destekleniyor.
 */
@Injectable()
export class OAuthService {
  private readonly googleClientId: string;
  private readonly googleClient: OAuth2Client;
  private readonly appleClientId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly appLogger: AppLogger,
  ) {
    this.googleClientId =
      this.configService.get<string>('oauth.google.clientId') || '';
    this.appleClientId =
      this.configService.get<string>('oauth.apple.clientId') || '';

    this.googleClient = new OAuth2Client(this.googleClientId);

    if (!this.googleClientId && !this.appleClientId) {
      this.appLogger.infrastructure(
        'OAuth client IDs not configured. Real OAuth will fail!',
      );
    }
  }

  /** OAuth token'ı doğrula ve kullanıcı bilgisini döndür */
  async verifyToken(
    provider: AuthProvider,
    credential: string,
  ): Promise<OAuthUserData> {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return this.verifyGoogleToken(credential);
      case AuthProvider.APPLE:
        return this.verifyAppleToken(credential);
      case AuthProvider.EMAIL:
        return this.verifyEmail(credential);
      default:
        throw new UnauthorizedException('Desteklenmeyen OAuth sağlayıcısı');
    }
  }

  /** Email doğrulama - Email'i auth provider olarak kullan */
  private verifyEmail(email: string): OAuthUserData {
    const emailLower = email.toLowerCase();

    this.appLogger.business('Email verification successful', {
      provider: 'email',
      emailDomain: emailLower.split('@')[1],
    });

    return {
      providerId: `email_${emailLower}`,
      email: emailLower,
    };
  }

  /** Google ID token doğrulama */
  private async verifyGoogleToken(idToken: string): Promise<OAuthUserData> {
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

  /** Apple identity token doğrulama */
  private async verifyAppleToken(
    identityToken: string,
  ): Promise<OAuthUserData> {
    try {
      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience: this.appleClientId,
        ignoreExpiration: false,
      });

      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException(
          'Apple token geçersiz veya eksik bilgi içeriyor',
        );
      }

      this.appLogger.business('OAuth verification successful', {
        provider: 'apple',
        emailDomain: payload.email.split('@')[1],
      });

      return {
        providerId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      this.appLogger.error(
        'Apple OAuth verification failed',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw new UnauthorizedException('Apple token doğrulanamadı');
    }
  }
}
