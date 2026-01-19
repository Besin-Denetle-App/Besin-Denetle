import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useRef, useState } from "react";

/**
 * Network durumu hook'u
 * Offline/online geçişlerinde geçici banner gösterir (3sn).
 */
export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);

  // Stale closure önleme için ref
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;

  useEffect(() => {
    // İlk durum
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    // Bağlantı değişikliklerini dinle
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // Güncel değeri ref'ten oku
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
  }, []);

  return {
    isConnected,
    showOfflineBanner,
    showOnlineBanner,
  };
}
