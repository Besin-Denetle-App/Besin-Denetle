import { registerAs } from '@nestjs/config';

/**
 * JWT konfigürasyonu
 */
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET!,
  accessTokenExpiresIn: 60 * 60 * 24 * 7, // 7 gün (saniye)
  refreshTokenExpiresIn: 60 * 60 * 24 * 365, // 1 yıl (saniye)
}));
