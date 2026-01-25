import { showSuccessToast } from "@/components/feedback";
import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useColorScheme } from "nativewind";
import { Text, TouchableOpacity, View } from "react-native";
import type { HistoryItem } from "../../stores/history.store";
import { formatDateShort } from "../../utils/format";
import { ProductImage } from "./product-image";

interface HistoryCardProps {
  item: HistoryItem;
  onPress: () => void;
}

/**
 * Geçmiş listesinde kullanılan ürün kartı
 */
export function HistoryCard({ item, onPress }: HistoryCardProps) {
  const { colorScheme } = useColorScheme();
  // Temaya göre renkleri al
  const themeColors = colorScheme === "dark" ? COLORS.dark : COLORS.light;
  const { product, barcode, viewedAt } = item;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row bg-card border border-border rounded-2xl overflow-hidden mb-3"
    >
      {/* Ürün resmi */}
      <ProductImage
        url={product.image_url}
        localPath={item.localImagePath}
        size={88}
        borderRadius={0}
      />

      {/* Ürün bilgileri */}
      <View className="flex-1 justify-center py-3 pl-3 pr-2">
        {/* Marka adı */}
        {product.brand && (
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            {product.brand}
          </Text>
        )}

        {/* Ürün adı */}
        <Text
          className="text-foreground font-semibold text-base"
          numberOfLines={2}
        >
          {product.name || "İsimsiz Ürün"}
        </Text>

        {/* Gramaj */}
        {product.quantity && (
          <Text className="text-muted-foreground text-sm mt-0.5">
            {product.quantity}
          </Text>
        )}

        {/* Barkod ve Tarih */}
        <View className="flex-row items-center mt-1.5">
          <TouchableOpacity
            onPress={async (e) => {
              e.stopPropagation();
              await Clipboard.setStringAsync(barcode);
              showSuccessToast("Barkod kopyalandı");
            }}
            activeOpacity={0.7}
            className="flex-row items-center"
          >
            <Ionicons
              name="barcode-outline"
              size={14}
              color={themeColors.muted}
            />
            <Text className="text-muted-foreground text-xs font-mono ml-1">
              {barcode}
            </Text>
            <Ionicons
              name="copy-outline"
              size={10}
              color={themeColors.muted}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
          <Text className="text-muted-foreground text-xs mx-2">•</Text>
          <Text className="text-muted-foreground text-xs">
            {formatDateShort(viewedAt)}
          </Text>
        </View>
      </View>

      {/* İleri ok */}
      <View className="justify-center ml-2">
        <Ionicons name="chevron-forward" size={20} color={themeColors.muted} />
      </View>
    </TouchableOpacity>
  );
}
