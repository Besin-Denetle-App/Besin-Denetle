/**
 * @file user.types.ts
 * @description Kullanıcı ve kimlik doğrulama tanımları
 * @package @besin-denetle/shared
 */

/**
 * Kimlik doğrulama sağlayıcısı
 */
export enum AuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  EMAIL = 'email',
}

/**
 * Kullanıcı rolü
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * Kullanıcı arayüzü
 */
export interface IUser {
  id: string;
  username: string;
  email: string;
  auth_provider: AuthProvider;
  provider_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  last_active?: Date;
}

/**
 * Kullanıcı oluşturma için gerekli alanlar
 */
export interface ICreateUser {
  username: string;
  email: string;
  auth_provider: AuthProvider;
  provider_id: string;
  role?: UserRole;
}
