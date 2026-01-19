import { registerAs } from '@nestjs/config';

/**
 * OAuth konfigürasyonu
 * Google ve Apple Sign In için client ID'ler.
 */
export default registerAs('oauth', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const googleClientId = process.env.GOOGLE_WEB_CLIENT_ID || '';
  const appleClientId = process.env.APPLE_CLIENT_ID || '';

  // Production'da en az bir provider zorunlu
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
