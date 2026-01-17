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
    // Border sadece borderRadius > 0 ise göster (bağımsız kullanımda)
    const showBorder = borderRadius > 0;
    
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          ...(showBorder && {
            borderWidth: 1,
            borderColor: colorScheme === 'dark' ? '#3f3f46' : '#e4e4e7',
          }),
          overflow: 'hidden',
        }}
      >
        <Image
          source={{ uri: imageSource }}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      </View>
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
