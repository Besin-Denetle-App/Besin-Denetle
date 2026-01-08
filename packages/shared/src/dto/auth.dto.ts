import { AuthProvider, IUser } from '../types';

/**
 * OAuth isteği
 */
export interface OAuthRequest {
  provider: AuthProvider;
  token: string;
}

/**
 * OAuth yanıtı - Yeni kullanıcı için (kayıt gerekli)
 */
export interface OAuthNewUserResponse {
  isNewUser: true;
  tempToken: string;
  message: string;
}

/**
 * Kullanıcı bilgileri (public alanlar)
 */
export interface UserPublicInfo {
  id: string;
  username: string;
  email: string;
  role: IUser['role'];
}

/**
 * OAuth yanıtı - Mevcut kullanıcı için (login başarılı)
 */
export interface OAuthExistingUserResponse {
  isNewUser: false;
  accessToken: string;
  refreshToken: string;
  user: UserPublicInfo;
}

/**
 * OAuth yanıtı - Her iki durumu kapsayan union type
 */
export type OAuthResponse = OAuthNewUserResponse | OAuthExistingUserResponse;

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
  user: UserPublicInfo;
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

/**
 * Çıkış yanıtı
 */
export interface LogoutResponse {
  message: string;
  userId: string;
}
