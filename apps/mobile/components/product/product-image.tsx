import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Image, View } from "react-native";

interface ProductImageProps {
  url?: string | null;
  localPath?: string; // Offline kullanım için local dosya yolu
  size?: number;
  borderRadius?: number;
  className?: string;
}

/**
 * Ürün resmi gösterici
 * Önce localPath, yoksa URL, hiçbiri yoksa placeholder.
 */
export function ProductImage({
  url,
  localPath,
  size = 80,
  borderRadius = 12,
  className = "",
}: ProductImageProps) {
  const { colorScheme } = useColorScheme();
  // Temaya göre renkleri al
  const themeColors = colorScheme === "dark" ? COLORS.dark : COLORS.light;

  // Kaynak önceliği: local > URL
  const imageSource = localPath || url;

  // Resim mevcutsa göster
  if (imageSource) {
    // Border sadece bağımsız kullanımda (borderRadius > 0) göster
    const showBorder = borderRadius > 0;

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          ...(showBorder && {
            borderWidth: 1,
            borderColor: themeColors.border,
          }),
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: imageSource }}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Placeholder ikon
  return (
    <View
      className={`items-center justify-center bg-secondary/50 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
      }}
    >
      <Ionicons
        name="nutrition-outline"
        size={size / 2.5}
        color={themeColors.divider}
      />
    </View>
  );
}
