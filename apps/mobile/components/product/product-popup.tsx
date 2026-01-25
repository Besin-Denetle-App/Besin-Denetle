import { COLORS } from "@/constants";
import type { IProduct } from "@besin-denetle/shared";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProductImage } from "./product-image";

// AI arama mesajını gösterme gecikmesi (ms)
const AI_SEARCH_DELAY_MS = 2000;

interface ProductPopupProps {
  visible: boolean;
  product: IProduct | null;
  isLoading: boolean;
  isFromAI?: boolean; // AI tarafından mı bulundu
  mode?: "confirm" | "non-food";
  barcodeType?: number; // 0=kararsız, 1=yiyecek, 2=içecek, 3=evcil hayvan, 9=diğer
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
  onFlag?: () => void;
}

/** Barkod tipine göre non-food mesajları */
const getNonFoodMessage = (type: number | undefined) => {
  switch (type) {
    case 0:
      return {
        title: "Kategori Belirlenemedi",
        description:
          "Bu ürünün kategorisi belirlenemedi. Eğer bu bir gıda ürünüyse bildirebilirsiniz.",
      };
    case 3:
      return {
        title: "Evcil Hayvan Ürünü",
        description:
          "Bu barkod evcil hayvan yiyeceği/içeceği kategorisinde. Eğer bu bir insan gıdası ise bildirebilirsiniz.",
      };
    case 9:
    default:
      return {
        title: "Gıda Ürünü Değil",
        description:
          "Bu barkod yiyecek veya içecek kategorisinde değil. Eğer bu bir gıda ürünüyse bildirebilirsiniz.",
      };
  }
};

/**
 * Ürün onay popup'ı
 * confirm: Normal onay akışı, non-food: Gıda dışı ürün uyarısı
 */
export function ProductPopup({
  visible,
  product,
  isLoading,
  isFromAI = false,
  mode = "confirm",
  barcodeType,
  onConfirm,
  onReject,
  onClose,
  onFlag,
}: ProductPopupProps) {
  const { colorScheme } = useColorScheme();

  // Temaya göre error rengi
  const errorColor =
    colorScheme === "dark"
      ? COLORS.semantic.error.dark
      : COLORS.semantic.error.light;
  const isNonFood = mode === "non-food";

  // AI arama mesajı state'i
  const [showAISearchMessage, setShowAISearchMessage] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Loading başladığında 2sn sonra AI mesajını göster
  useEffect(() => {
    if (isLoading && visible) {
      // Timer başlat
      timeoutRef.current = setTimeout(() => {
        setShowAISearchMessage(true);
      }, AI_SEARCH_DELAY_MS);
    } else {
      // Loading bitti veya popup kapandı, timer'ı temizle ve state'i sıfırla
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowAISearchMessage(false);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <SafeAreaView
            className="bg-card rounded-t-3xl px-6 pt-6 pb-4"
            edges={["bottom"]}
          >
            {/* Kapat Butonu */}
            <TouchableOpacity
              onPress={onClose}
              className="absolute top-4 right-4 w-10 h-10 items-center justify-center"
            >
              <Ionicons
                name="close"
                size={24}
                color={colorScheme === "dark" ? "#A3A3A3" : "#737373"}
              />
            </TouchableOpacity>

            {/* Loading State */}
            {isLoading && (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="text-muted-foreground mt-4">
                  {showAISearchMessage
                    ? "Ürün DB'de bulunamadı, AI ile aranıyor..."
                    : "Ürün bilgileri yükleniyor..."}
                </Text>
                {showAISearchMessage && (
                  <Text className="text-muted-foreground text-xs mt-2 text-center px-4">
                    Bu işlem biraz zaman alabilir
                  </Text>
                )}
              </View>
            )}

            {/* Non-Food Uyarısı */}
            {!isLoading && isNonFood && (
              <>
                <View className="items-center mb-4">
                  <View className="w-16 h-16 bg-amber-500/20 rounded-full items-center justify-center mb-3">
                    <Ionicons
                      name="warning"
                      size={32}
                      color={COLORS.semantic.warning}
                    />
                  </View>
                  <Text className="text-foreground text-xl font-bold text-center">
                    {getNonFoodMessage(barcodeType).title}
                  </Text>
                </View>

                {/* Ürün Bilgisi (varsa) */}
                {product && (
                  <View className="bg-secondary/30 rounded-2xl px-4 py-3 mb-4 w-full">
                    {product.brand && (
                      <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                        {product.brand}
                      </Text>
                    )}
                    <Text className="text-foreground font-semibold">
                      {product.name || "İsimsiz Ürün"}
                    </Text>
                    {product.quantity && (
                      <Text className="text-muted-foreground text-sm">
                        {product.quantity}
                      </Text>
                    )}
                  </View>
                )}

                <Text className="text-muted-foreground text-center text-sm mb-6 px-4">
                  {getNonFoodMessage(barcodeType).description}
                </Text>

                {/* Butonlar */}
                <View className="gap-3">
                  {/* Geri Dön Butonu */}
                  <TouchableOpacity
                    onPress={onClose}
                    className="bg-secondary py-4 rounded-2xl items-center flex-row justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={24}
                      color={colorScheme === "dark" ? "#E0E0E0" : "#212121"}
                    />
                    <Text className="text-foreground font-bold text-base ml-2">
                      Geri Dön
                    </Text>
                  </TouchableOpacity>

                  {/* Bildir Butonu */}
                  <TouchableOpacity
                    onPress={onFlag}
                    className="bg-amber-500/10 border border-amber-500/20 py-4 rounded-2xl items-center flex-row justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="flag"
                      size={24}
                      color={COLORS.semantic.warning}
                    />
                    <Text className="text-amber-600 dark:text-amber-400 font-bold text-base ml-2">
                      Bu Ürünü Bildir
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Normal Onay Modu - Ürün Bilgileri */}
            {!isLoading && !isNonFood && product && (
              <>
                {/* Ürün Görseli */}
                <View className="items-center mb-6">
                  <ProductImage
                    url={product.image_url}
                    size={128}
                    borderRadius={16}
                  />
                </View>

                {/* Marka ve İsim */}
                <View className="items-center mb-4">
                  {product.brand && (
                    <Text className="text-muted-foreground text-sm uppercase tracking-wider mb-1">
                      {product.brand}
                    </Text>
                  )}
                  <Text className="text-foreground text-xl font-bold text-center">
                    {product.name || "İsimsiz Ürün"}
                  </Text>
                  {product.quantity && (
                    <Text className="text-muted-foreground text-base mt-1">
                      {product.quantity}
                    </Text>
                  )}
                </View>

                {/* AI Badge - Ürün AI tarafından bulunduysa */}
                {isFromAI && (
                  <View className="items-center mb-4">
                    <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full flex-row items-center">
                      <Ionicons
                        name="sparkles"
                        size={14}
                        color={COLORS.primary}
                      />
                      <Text className="text-primary text-xs font-medium ml-1.5">
                        AI ile bulundu
                      </Text>
                    </View>
                  </View>
                )}

                {/* Soru */}
                <Text className="text-foreground text-center text-base mb-6">
                  Ürün bilgileri doğru mu?
                </Text>

                {/* Butonlar */}
                <View className="gap-3">
                  {/* EVET Butonu */}
                  <TouchableOpacity
                    onPress={onConfirm}
                    className="bg-primary py-4 rounded-2xl items-center flex-row justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text className="text-primary-foreground font-bold text-base ml-2">
                      Evet, Doğru
                    </Text>
                  </TouchableOpacity>

                  {/* HAYIR Butonu */}
                  <TouchableOpacity
                    onPress={onReject}
                    className="bg-destructive/10 border border-destructive/20 py-4 rounded-2xl items-center flex-row justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={errorColor}
                    />
                    <Text className="text-destructive font-bold text-base ml-2">
                      Hayır, Yanlış
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Ürün bulunamadı durumu */}
            {!isLoading && !isNonFood && !product && (
              <View className="items-center py-8">
                <Ionicons
                  name="alert-circle-outline"
                  size={64}
                  color={errorColor}
                />
                <Text className="text-foreground text-lg font-bold mt-4">
                  Ürün Bulunamadı
                </Text>
                <Text className="text-muted-foreground text-center mt-2">
                  Bu barkoda ait ürün bilgisi bulunamadı.
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-secondary mt-6 px-8 py-3 rounded-full"
                  activeOpacity={0.7}
                >
                  <Text className="text-foreground font-semibold">Kapat</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
