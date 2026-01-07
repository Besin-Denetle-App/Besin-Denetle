import { registerAs } from '@nestjs/config';

/**
 * OAuth konfigürasyonu.
 * Google ve Apple Sign In için gerekli client ID'ler.
 */
export default registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
  },
}));
