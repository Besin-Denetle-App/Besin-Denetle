/**
 * Debounced navigation hook
 * 
 * Ardışık hızlı tıklamalarda çift navigasyonu engeller.
 * Sektör standardı: son tıklamadan 500ms sonra navigasyon yapılır.
 */
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

const DEBOUNCE_DELAY = 500; // ms

/**
 * Debounced router.push - Hızlı ardışık tıklamaları engeller
 * @returns navigate fonksiyonu
 */
export function useDebouncedNavigation() {
  const lastNavigationTime = useRef<number>(0);
  const isNavigating = useRef<boolean>(false);

  const navigate = useCallback((path: string) => {
    const now = Date.now();
    
    // Son navigasyondan bu yana geçen süre kontrolü
    if (now - lastNavigationTime.current < DEBOUNCE_DELAY) {
      return; // Çok hızlı tıklama, yoksay
    }

    // Zaten navigasyon devam ediyorsa yoksay
    if (isNavigating.current) {
      return;
    }

    isNavigating.current = true;
    lastNavigationTime.current = now;

    // Navigasyonu yap
    router.push(path as any);

    // Kısa bir süre sonra tekrar izin ver
    setTimeout(() => {
      isNavigating.current = false;
    }, DEBOUNCE_DELAY);
  }, []);

  return { navigate };
}

/**
 * Debounced callback - Herhangi bir fonksiyonu debounce eder
 * @param callback - Debounce edilecek fonksiyon
 * @param delay - Bekleme süresi (ms)
 * @returns Debounced fonksiyon
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = DEBOUNCE_DELAY
): T {
  const lastCallTime = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallTime.current < delay) {
        return; // Çok hızlı çağrı, yoksay
      }

      lastCallTime.current = now;
      callback(...args);
    }) as T,
    [callback, delay]
  );
}
