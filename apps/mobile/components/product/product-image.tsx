import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Image, View } from 'react-native';

interface ProductImageProps {
  url?: string | null;
  localPath?: string; // Telefona indirilmiş resim yolu
  size?: number;
  borderRadius?: number;
  className?: string;
}

/**
 * Ürün resmi componenti
 * - localPath varsa local dosyadan gösterir (offline destek)
 * - Yoksa URL'den gösterir
 * - Hiçbiri yoksa placeholder icon gösterir
 */
export function ProductImage({
  url,
  localPath,
  size = 80,
  borderRadius = 12,
  className = '',
}: ProductImageProps) {
  const { colorScheme } = useColorScheme();

  // Önce local path, sonra URL
  const imageSource = localPath || url;

  // Resim varsa göster
  if (imageSource) {
    return (
      <Image
        source={{ uri: imageSource }}
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
        resizeMode="cover"
      />
    );
  }

  // Resim yoksa placeholder icon
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
        color={colorScheme === 'dark' ? '#404040' : '#D4D4D4'}
      />
    </View>
  );
}
