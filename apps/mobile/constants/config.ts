/**
 * Uygulama konfigürasyon sabitleri
 */
import Constants from "expo-constants";

export const APP_CONFIG = {
  /**
   * Geçmiş kayıt ayarları
   */
  history: {
    maxDays: 40, // Kayıt saklama süresi (gün)
    maxCount: 200, // Max kayıt sayısı
  },

  /**
   * Barkod tarayıcı ayarları
   */
  scanner: {
    confirmationThreshold: 3, // Kaç kez okunursa barkod onaylanır
    scanDebounceMs: 333, // Taramalar arası minimum süre (ms)
    supportedFormats: [
      "ean13",
      "ean8",
      "upc_a",
      "upc_e",
      "code128",
      "code39",
    ] as const,
  },

  /**
   * API ayarları
   */
  api: {
    timeout: 60000, // 60sn (AI işlemleri uzun sürebilir)
  },

  /**
   * Storage anahtarları
   */
  storageKeys: {
    accessToken: "access_token",
    refreshToken: "refresh_token",
    userData: "user_data",
    scanHistory: "scan_history",
  },

  /**
   * Dosya sistemi
   */
  fileSystem: {
    imageDirectory: "product_images/",
  },

  /**
   * Harici URL'ler
   */
  urls: {
    privacy: "https://besindenetle.furkanpasa.com/privacy",
    terms: "https://besindenetle.furkanpasa.com/terms",
  },
} as const;

/**
 * Uygulama bilgileri - app.config.js'den okunur (single source of truth)
 * Değerler eksikse uygulama başlamadan hata verir
 */
const getRequiredConfig = <T>(value: T | undefined, name: string): T => {
  if (value === undefined || value === null) {
    throw new Error(`[CONFIG] app.config.js'de "${name}" tanımlı değil!`);
  }
  return value;
};

export const APP_INFO = {
  name: getRequiredConfig(Constants.expoConfig?.name, "name"),
  version: getRequiredConfig(Constants.expoConfig?.version, "version"),
  bundleId: {
    android: getRequiredConfig(
      Constants.expoConfig?.android?.package,
      "android.package",
    ),
    ios: getRequiredConfig(
      Constants.expoConfig?.ios?.bundleIdentifier,
      "ios.bundleIdentifier",
    ),
  },
} as const;
