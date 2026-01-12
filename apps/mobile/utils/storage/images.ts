/**
 * Resim depolama işlemleri
 * Ürün resimlerinin telefona indirilmesi ve yönetimi
 */
import * as FileSystem from 'expo-file-system';
import { APP_CONFIG } from '../../constants';

/**
 * Resim dizini yolunu al
 */
function getImageDir(): string {
  // expo-file-system'da documentDirectory nullable olabilir
  const docDir = (FileSystem as unknown as { documentDirectory: string | null }).documentDirectory;
  if (!docDir) {
    throw new Error('FileSystem.documentDirectory is not available');
  }
  return `${docDir}${APP_CONFIG.fileSystem.imageDirectory}`;
}

/**
 * Resim dizininin var olduğundan emin ol
 */
export async function ensureImageDirectory(): Promise<void> {
  const imageDir = getImageDir();
  const dirInfo = await FileSystem.getInfoAsync(imageDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
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

  try {
    // Dizin yoksa oluştur
    await ensureImageDirectory();

    // Dosya uzantısını al (varsayılan jpg)
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const imageDir = getImageDir();
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
  try {
    const imageDir = getImageDir();
    const dirInfo = await FileSystem.getInfoAsync(imageDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(imageDir, { idempotent: true });
    }
  } catch (error) {
    console.error('[ImageStorage] Clear all error:', error);
  }
}

/**
 * Resim dizini yolunu al
 */
export function getImageDirectory(): string {
  return getImageDir();
}
