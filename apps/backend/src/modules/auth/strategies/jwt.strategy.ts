import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

/**
 * JWT Strategy
 * Passport JWT doğrulama stratejisi
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'dev-secret-key';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * JWT payload doğrulandıktan sonra çağrılır
   * Kullanıcı bilgisini döndürür
   */
  async validate(payload: JwtPayload) {
    const user = await this.authService.findById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya aktif değil');
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
