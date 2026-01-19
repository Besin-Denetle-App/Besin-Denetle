/**
 * Debounced navigation hook
 * Ardışık hızlı tıklamalarda çift navigasyonu engeller.
 */
import { router } from "expo-router";
import { useCallback, useRef } from "react";

const DEBOUNCE_DELAY = 500; // ms

/**
 * Debounced router.push
 */
export function useDebouncedNavigation() {
  const lastNavigationTime = useRef<number>(0);
  const isNavigating = useRef<boolean>(false);

  const navigate = useCallback((path: string) => {
    const now = Date.now();

    // Debounce kontrolü
    if (now - lastNavigationTime.current < DEBOUNCE_DELAY) {
      return; // Çok hızlı tıklama, yoksay
    }

    // Navigasyon devam ediyorsa yoksay
    if (isNavigating.current) {
      return;
    }

    isNavigating.current = true;
    lastNavigationTime.current = now;

    // Navigasyonu yap
    router.push(path as any);

    // Cooldown sonrası tekrar izin ver
    setTimeout(() => {
      isNavigating.current = false;
    }, DEBOUNCE_DELAY);
  }, []);

  return { navigate };
}

/**
 * Generic debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = DEBOUNCE_DELAY,
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
    [callback, delay],
  );
}
