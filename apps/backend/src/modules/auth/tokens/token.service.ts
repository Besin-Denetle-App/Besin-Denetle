import { AuthProvider, TEMP_TOKEN_EXPIRY_MS } from '@besin-denetle/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RateLimitService } from '../../../common';
import { User } from '../../../entities';

/** Kayıt süreci için geçici token verisi */
interface TempTokenData {
  provider: AuthProvider;
  providerId: string;
  email: string;
}

/** JWT payload yapısı */
interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

/**
 * JWT ve geçici token yönetimi servisi.
 * Access/refresh token oluşturma ve temp token işlemleri.
 * Temp token'lar Redis'te tutulur (PM2 cluster uyumlu).
 */
@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;
  private readonly TEMP_TOKEN_PREFIX = 'temp_token:';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
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

  // ===== Geçici Token İşlemleri (Redis) =====

  /** Kayıt için geçici token oluştur (Redis'e kaydet) */
  async createTempToken(
    provider: AuthProvider,
    providerId: string,
    email: string,
  ): Promise<string> {
    const tempToken = uuidv4();
    const key = `${this.TEMP_TOKEN_PREFIX}${tempToken}`;
    const ttlSeconds = Math.floor(TEMP_TOKEN_EXPIRY_MS / 1000);

    await this.rateLimitService.setex(
      key,
      ttlSeconds,
      JSON.stringify({ provider, providerId, email }),
    );

    return tempToken;
  }

  /** Geçici token'ı doğrula ve verisini döndür (Redis'ten oku) */
  async validateTempToken(tempToken: string): Promise<TempTokenData> {
    const key = `${this.TEMP_TOKEN_PREFIX}${tempToken}`;
    const data = await this.rateLimitService.get(key);

    if (!data) {
      throw new UnauthorizedException(
        "Geçersiz veya süresi dolmuş kayıt token'ı",
      );
    }

    try {
      return JSON.parse(data) as TempTokenData;
    } catch {
      throw new UnauthorizedException("Geçersiz kayıt token'ı");
    }
  }

  /** Geçici token'ı sil (kayıt tamamlandığında) */
  async deleteTempToken(tempToken: string): Promise<void> {
    const key = `${this.TEMP_TOKEN_PREFIX}${tempToken}`;
    await this.rateLimitService.del(key);
  }
}
