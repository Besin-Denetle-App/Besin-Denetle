/**
 * Storage modülü - merkezi export
 */

// Token işlemleri
export {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    hasToken,
    saveTokens
} from "./tokens";

// Kullanıcı işlemleri
export { clearUser, getUser, saveUser } from "./user";

// Resim işlemleri
export {
    clearAllImages,
    deleteImage,
    downloadImage,
    ensureImageDirectory,
    getImageDirectory
} from "./images";

/**
 * Auth verilerini temizle (logout)
 */
export async function clearAuthData(): Promise<void> {
  const { clearTokens } = await import("./tokens");
  const { clearUser } = await import("./user");

  await Promise.all([clearTokens(), clearUser()]);
}

/**
 * Tüm uygulama verilerini temizle
 */
export async function clearAllData(): Promise<void> {
  const { clearAllImages } = await import("./images");

  await Promise.all([clearAuthData(), clearAllImages()]);
}
