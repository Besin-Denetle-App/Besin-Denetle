import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET')!;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /** JWT payload doğrulandıktan sonra user bilgisini döndürür */
  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // Admin ban kontrolü
    if (!user.is_active) {
      throw new UnauthorizedException('Hesabınız askıya alınmış');
    }

    // Soft delete kontrolü - özel mesaj
    if (user.is_deleted) {
      throw new UnauthorizedException(
        "Hesabınız silinme sürecinde. Geri yüklemek için restore-account endpoint'ini kullanın.",
      );
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
