import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    // İlk bağlantı durumunu al
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    // Bağlantı değişikliklerini dinle
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = isConnected;
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
  }, [isConnected]);

  return {
    isConnected,
    showOfflineBanner,
    showOnlineBanner,
  };
}
