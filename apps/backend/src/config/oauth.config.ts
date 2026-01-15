import { registerAs } from '@nestjs/config';

/**
 * OAuth konfigürasyonu.
 * Google ve Apple Sign In için gerekli client ID'ler.
 *
 * Production'da en az biri zorunlu:
 * - GOOGLE_WEB_CLIENT_ID (Google ile giriş için)
 * - APPLE_CLIENT_ID (Apple ile giriş için)
 */
export default registerAs('oauth', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const googleClientId = process.env.GOOGLE_WEB_CLIENT_ID || '';
  const appleClientId = process.env.APPLE_CLIENT_ID || '';

  // Production'da en az bir OAuth provider zorunlu
  if (isProduction && !googleClientId && !appleClientId) {
    throw new Error(
      'Production ortamında en az bir OAuth provider (GOOGLE_WEB_CLIENT_ID veya APPLE_CLIENT_ID) zorunludur!',
    );
  }

  return {
    google: {
      clientId: googleClientId,
    },
    apple: {
      clientId: appleClientId,
    },
  };
});
