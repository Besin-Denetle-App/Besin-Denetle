/**
 * Navigasyon tip tanımlamaları
 * Expo Router typed routes ile otomatik oluşturulur.
 */

// Ürün detay sayfası parametreleri
export interface ProductDetailParams {
  id: string;
}

// Tab navigasyon tipleri
export type TabRoutes = "/" | "/scan";

// Auth navigasyon tipleri
export type AuthRoutes = "/(auth)/login" | "/(auth)/register";

// Product navigasyon tipleri
export type ProductRoutes = `/product/${string}`;

// Tüm route'lar
export type AppRoutes = TabRoutes | AuthRoutes | ProductRoutes;
