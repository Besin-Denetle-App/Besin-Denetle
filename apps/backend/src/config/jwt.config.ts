import { registerAs } from '@nestjs/config';

/**
 * JWT konfigürasyonu.
 * Access token ve refresh token süreleri merkezi olarak yönetilir.
 *
 * Production'da zorunlu:
 * - JWT_SECRET (en az 32 karakter önerilir)
 */
export default registerAs('jwt', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Production'da JWT_SECRET zorunlu
  if (isProduction && !process.env.JWT_SECRET) {
    throw new Error(
      'Production ortamında JWT_SECRET environment variable zorunludur!',
    );
  }

  return {
    secret: process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-production',
    accessTokenExpiresIn: 60 * 60 * 24 * 7, // 7 gün (saniye)
    refreshTokenExpiresIn: 60 * 60 * 24 * 365, // 1 yıl (saniye)
  };
});
