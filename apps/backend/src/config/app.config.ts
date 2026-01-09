/**
 * Uygulama Sabitleri Konfigürasyonu
 * CDN, placeholder resimler ve diğer statik değerler buradan yönetilir.
 *
 * Bu dosyanın avantajı:
 * - Backend değişikliği için sadece backend rebuild gerekir
 * - Mobil app veya shared paketi yeniden derleme gerekmez
 * - Environment variable ile override edilebilir
 */

// Ürün placeholder resmi (ürün görseli olmadığında kullanılır)
export const DEFAULT_PRODUCT_IMAGE_URL =
  process.env.DEFAULT_PRODUCT_IMAGE_URL || null;

// CDN base URL (ileride resim yönetimi eklenirse)
export const CDN_BASE_URL =
  process.env.CDN_BASE_URL || 'https://cdn.besindenetle.com';

// Placeholder URL helper
export const getProductImageUrl = (imageUrl: string | null): string | null => {
  // null ise null döndür (frontend kendi placeholder'ını kullanacak)
  // Gelecekte CDN URL prefix eklenebilir
  return imageUrl;
};
