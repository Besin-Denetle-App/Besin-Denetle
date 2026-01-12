/**
 * Uygulama genelinde kullanılan sabit değerler
 */
import Constants from 'expo-constants';

export const APP_CONFIG = {
  /**
   * Geçmiş ayarları
   */
  history: {
    maxDays: 40, // Geçmiş kayıtları kaç gün tutulsun
    maxCount: 200, // Maksimum geçmiş kayıt sayısı
  },

  /**
   * Barkod tarayıcı ayarları
   */
  scanner: {
    confirmationThreshold: 3, // Kaç kez okunursa barkod onaylanır
    scanDebounceMs: 500, // Taramalar arası minimum süre (ms)
    supportedFormats: [
      'ean13',
      'ean8',
      'upc_a',
      'upc_e',
      'code128',
      'code39',
    ] as const,
  },

  /**
   * API ayarları
   */
  api: {
    timeout: 30000, // 30 saniye (AI işlemleri uzun sürebilir)
    retryCount: 3, // Maksimum retry sayısı
    retryBaseDelay: 1000, // İlk retry gecikmesi (ms)
    retryMaxDelay: 8000, // Maksimum retry gecikmesi (ms)
  },

  /**
   * Storage anahtarları
   */
  storageKeys: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    userData: 'user_data',
    scanHistory: 'scan_history',
  },

  /**
   * Dosya sistemi
   */
  fileSystem: {
    imageDirectory: 'product_images/',
  },
} as const;

/**
 * Uygulama bilgileri - app.config.js'den dinamik olarak okunur
 * Bu sayede tek kaynak (single source of truth) sağlanır
 */
export const APP_INFO = {
  name: Constants.expoConfig?.name || 'Besin Denetle',
  version: Constants.expoConfig?.version || '2.0.1',
  bundleId: {
    android: Constants.expoConfig?.android?.package || 'app.besindenetle.android',
    ios: Constants.expoConfig?.ios?.bundleIdentifier || 'app.besindenetle.ios',
  },
} as const;

