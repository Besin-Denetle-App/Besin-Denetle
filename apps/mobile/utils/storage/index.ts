/**
 * Storage modülü
 * Tüm depolama işlemlerinin merkezi dışa aktarımı
 */

// Token işlemleri
export {
    clearTokens, getAccessToken,
    getRefreshToken,
    hasToken, saveTokens
} from './tokens';

// Kullanıcı işlemleri
export {
    clearUser, getUser, saveUser
} from './user';

// Resim işlemleri
export {
    clearAllImages, deleteImage, downloadImage, ensureImageDirectory,
    getImageDirectory
} from './images';

/**
 * Tüm auth verilerini temizle (logout için)
 * Token, kullanıcı ve resimleri temizler
 */
export async function clearAuthData(): Promise<void> {
  const { clearTokens } = await import('./tokens');
  const { clearUser } = await import('./user');

  await Promise.all([
    clearTokens(),
    clearUser(),
  ]);
}

/**
 * Tüm uygulama verilerini temizle
 * Auth + resimler dahil her şeyi temizler
 */
export async function clearAllData(): Promise<void> {
  const { clearAllImages } = await import('./images');

  await Promise.all([
    clearAuthData(),
    clearAllImages(),
  ]);
}
