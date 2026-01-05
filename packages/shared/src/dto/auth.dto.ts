import { AuthProvider, IUser } from '../types';

/**
 * OAuth isteği
 */
export interface OAuthRequest {
  provider: AuthProvider;
  token: string;
}

/**
 * OAuth yanıtı - Mevcut kullanıcı için
 */
export interface OAuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

/**
 * OAuth yanıtı - Yeni kullanıcı için
 */
export interface OAuthRegisterResponse {
  tempToken: string;
  email: string;
  needsRegistration: true;
}

/**
 * Kayıt isteği
 */
export interface RegisterRequest {
  tempToken: string;
  username: string;
  termsAccepted: boolean;
}

/**
 * Kayıt yanıtı
 */
export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

/**
 * Token yenileme isteği
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Token yenileme yanıtı
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
