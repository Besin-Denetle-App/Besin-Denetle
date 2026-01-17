/**
 * Resim depolama işlemleri
 * Ürün resimlerinin telefona indirilmesi ve yönetimi
 */
import * as FileSystem from 'expo-file-system';
import { APP_CONFIG } from '../../constants';

/**
 * Resim dizini yolunu al
 * Expo Go'da bazen documentDirectory null olabilir
 * @returns Dizin yolu veya null (hazır değilse)
 */
function getImageDir(): string | null {
  // expo-file-system'da documentDirectory nullable olabilir
  const docDir = (FileSystem as unknown as { documentDirectory: string | null }).documentDirectory;
  if (!docDir) {
    // Expo Go'da uygulama tam başlatılmadan null dönebilir
    console.warn('[ImageStorage] documentDirectory is not available yet');
    return null;
  }
  return `${docDir}${APP_CONFIG.fileSystem.imageDirectory}`;
}

/**
 * Resim dizininin var olduğundan emin ol
 * @returns true başarılı, false dizin hazır değil
 */
export async function ensureImageDirectory(): Promise<boolean> {
  const imageDir = getImageDir();
  if (!imageDir) {
    return false;
  }
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(imageDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Resmi telefona indir
 * @param imageUrl - Uzak resim URL'si
 * @param productId - Ürün ID'si (dosya adı için)
 * @returns Local dosya yolu veya undefined
 */
export async function downloadImage(
  imageUrl: string | null,
  productId: string
): Promise<string | undefined> {
  if (!imageUrl) return undefined;

  // Dizin hazır mı kontrol et
  const imageDir = getImageDir();
  if (!imageDir) {
    // documentDirectory henüz hazır değil, resim indirmeyi atla
    return undefined;
  }

  try {
    // Dizin yoksa oluştur
    const dirReady = await ensureImageDirectory();
    if (!dirReady) {
      return undefined;
    }

    // Dosya uzantısını al (varsayılan jpg)
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const localPath = `${imageDir}${productId}.${extension}`;

    // Zaten varsa tekrar indirme
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      return localPath;
    }

    // Resmi indir
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);

    if (downloadResult.status === 200) {
      return localPath;
    }

    return undefined;
  } catch (error) {
    console.error('[ImageStorage] Download error:', error);
    return undefined;
  }
}

/**
 * Local resmi sil
 * @param localPath - Silinecek dosya yolu
 */
export async function deleteImage(localPath: string | undefined): Promise<void> {
  if (!localPath) return;

  try {
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    }
  } catch (error) {
    console.error('[ImageStorage] Delete error:', error);
  }
}

/**
 * Tüm ürün resimlerini temizle
 */
export async function clearAllImages(): Promise<void> {
  const imageDir = getImageDir();
  if (!imageDir) {
    return;
  }
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(imageDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(imageDir, { idempotent: true });
    }
  } catch (error) {
    console.error('[ImageStorage] Clear all error:', error);
  }
}

/**
 * Resim dizini yolunu al (dışarıya export)
 * @returns Dizin yolu veya null
 */
export function getImageDirectory(): string | null {
  return getImageDir();
}
