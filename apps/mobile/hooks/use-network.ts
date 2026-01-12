import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

/**
 * Network durumunu takip eden hook
 *
 * Kullanım:
 * const { isConnected, showBanner } = useNetwork();
 *
 * Özellikler:
 * - Bağlantı durumunu takip eder
 * - Offline/Online geçişlerinde geçici banner gösterir (3 saniye)
 * - Kalıcı uyarı yok (kullanıcı local geçmişe bakıyor olabilir)
 */
export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);

  // Stale closure'ı önlemek için ref kullan
  // Event listener callback'i her zaman güncel değeri okur
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;

  useEffect(() => {
    // İlk bağlantı durumunu al
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    // Bağlantı değişikliklerini dinle
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // Ref üzerinden güncel değeri oku (stale closure yok)
      const wasConnected = isConnectedRef.current;
      const nowConnected = state.isConnected;

      setIsConnected(nowConnected);

      // Offline'a geçiş
      if (wasConnected === true && nowConnected === false) {
        setShowOfflineBanner(true);
        // 3 saniye sonra banner'ı gizle
        setTimeout(() => setShowOfflineBanner(false), 3000);
      }

      // Online'a geçiş
      if (wasConnected === false && nowConnected === true) {
        setShowOnlineBanner(true);
        // 3 saniye sonra banner'ı gizle
        setTimeout(() => setShowOnlineBanner(false), 3000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // Artık dependency yok, sadece bir kez subscribe olur

  return {
    isConnected,
    showOfflineBanner,
    showOnlineBanner,
  };
}
