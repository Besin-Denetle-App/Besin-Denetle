import { AuthProvider, TEMP_TOKEN_EXPIRY_MS } from '@besin-denetle/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../entities';

/** Kayıt süreci için geçici token verisi (RAM'de) */
interface TempTokenData {
  provider: AuthProvider;
  providerId: string;
  email: string;
  expiresAt: number;
}

/** JWT payload yapısı */
interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

// Geçici token deposu - ileride Redis'e taşınabilir
const tempTokenStore = new Map<string, TempTokenData>();

/**
 * JWT ve geçici token yönetimi servisi.
 * Access/refresh token oluşturma ve temp token işlemleri.
 */
@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')!;
    this.accessTokenExpiresIn = this.configService.get<number>(
      'jwt.accessTokenExpiresIn',
    )!;
    this.refreshTokenExpiresIn = this.configService.get<number>(
      'jwt.refreshTokenExpiresIn',
    )!;
  }

  /** Access ve refresh token çifti oluştur */
  generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /** Refresh token'ı doğrula ve payload döndür */
  verifyRefreshToken(refreshToken: string): { sub: string } {
    try {
      return this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  // ===== Geçici Token İşlemleri =====

  /** Kayıt için geçici token oluştur */
  createTempToken(
    provider: AuthProvider,
    providerId: string,
    email: string,
  ): string {
    const tempToken = uuidv4();
    tempTokenStore.set(tempToken, {
      provider,
      providerId,
      email,
      expiresAt: Date.now() + TEMP_TOKEN_EXPIRY_MS,
    });
    return tempToken;
  }

  /** Geçici token'ı doğrula ve verisini döndür */
  validateTempToken(tempToken: string): TempTokenData {
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

    return tokenData;
  }

  /** Geçici token'ı sil (kayıt tamamlandığında) */
  deleteTempToken(tempToken: string): void {
    tempTokenStore.delete(tempToken);
  }
}
