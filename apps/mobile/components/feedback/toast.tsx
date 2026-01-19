import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastCallback: ((message: string, type: ToastType) => void) | null =
  null;

/**
 * Global toast gösterici. Uygulama genelinde erişilebilir.
 */
export const showToast = (message: string, type: ToastType = "info") => {
  if (addToastCallback) {
    addToastCallback(message, type);
  }
};

// Tip bazlı kısayol fonksiyonları
export const showSuccessToast = (message: string) =>
  showToast(message, "success");
export const showErrorToast = (message: string) => showToast(message, "error");
export const showInfoToast = (message: string) => showToast(message, "info");

/**
 * Toast container. _layout.tsx'e mount edilmeli.
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastCallback = (message: string, type: ToastType) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss: 3 saniye
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    return () => {
      addToastCallback = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute bottom-24 left-4 right-4 z-50 gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Giriş animasyonu
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Çıkış animasyonu (dismiss öncesi)
    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 2700);

    return () => clearTimeout(timeout);
  }, [opacity]);

  const getStyle = () => {
    switch (toast.type) {
      case "success":
        return { bg: "bg-green-600/95", icon: "checkmark-circle" as const };
      case "error":
        return { bg: "bg-destructive/95", icon: "alert-circle" as const };
      default:
        return { bg: "bg-primary/95", icon: "information-circle" as const };
    }
  };

  const style = getStyle();

  return (
    <Animated.View
      style={{ opacity }}
      className={`${style.bg} px-4 py-3 rounded-xl flex-row items-center`}
    >
      <Ionicons name={style.icon} size={20} color="#FFFFFF" />
      <Text className="text-white font-medium ml-2 flex-1">
        {toast.message}
      </Text>
    </Animated.View>
  );
}
