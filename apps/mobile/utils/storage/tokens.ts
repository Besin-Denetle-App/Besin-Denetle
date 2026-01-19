/**
 * Token işlemleri
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG } from "../../constants";

const { storageKeys } = APP_CONFIG;

/**
 * Token'ları kaydet
 */
export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await AsyncStorage.multiSet([
    [storageKeys.accessToken, accessToken],
    [storageKeys.refreshToken, refreshToken],
  ]);
}

/**
 * Access token'ı getir
 */
export async function getAccessToken(): Promise<string | null> {
  return await AsyncStorage.getItem(storageKeys.accessToken);
}

/**
 * Refresh token'ı getir
 */
export async function getRefreshToken(): Promise<string | null> {
  return await AsyncStorage.getItem(storageKeys.refreshToken);
}

/**
 * Token var mı kontrol et
 */
export async function hasToken(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * Tüm token'ları temizle
 */
export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    storageKeys.accessToken,
    storageKeys.refreshToken,
  ]);
}
