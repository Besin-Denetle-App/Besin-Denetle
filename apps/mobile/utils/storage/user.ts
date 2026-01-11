/**
 * Kullanıcı bilgisi işlemleri
 * Kullanıcı verilerinin AsyncStorage'da saklanması
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../constants';

const { storageKeys } = APP_CONFIG;

/**
 * Kullanıcı bilgisini kaydet
 */
export async function saveUser<T extends object>(user: T): Promise<void> {
  await AsyncStorage.setItem(storageKeys.userData, JSON.stringify(user));
}

/**
 * Kullanıcı bilgisini getir
 */
export async function getUser<T>(): Promise<T | null> {
  const data = await AsyncStorage.getItem(storageKeys.userData);
  return data ? JSON.parse(data) : null;
}

/**
 * Kullanıcı bilgisini temizle
 */
export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(storageKeys.userData);
}
