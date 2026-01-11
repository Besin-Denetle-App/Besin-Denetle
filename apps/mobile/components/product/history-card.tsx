import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Text, TouchableOpacity, View } from 'react-native';
import type { HistoryItem } from '../../stores/history.store';
import { formatDateShort } from '../../utils/format';
import { ProductImage } from './product-image';

interface HistoryCardProps {
  item: HistoryItem;
  onPress: () => void;
}

/**
 * Geçmiş arama kartı componenti
 * Solda ürün resmi, sağda barkod, marka, isim, gramaj gösterir
 */
export function HistoryCard({ item, onPress }: HistoryCardProps) {
  const { colorScheme } = useColorScheme();
  const { product, barcode, viewedAt } = item;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row bg-card border border-border rounded-2xl p-3 mb-3"
    >
      {/* Sol: Ürün Resmi */}
      <ProductImage 
        url={product.image_url} 
        localPath={item.localImagePath} 
        size={80} 
        borderRadius={12} 
        className="mr-3" 
      />

      {/* Sağ: Ürün Bilgileri */}
      <View className="flex-1 justify-center">
        {/* Marka */}
        {product.brand && (
          <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">
            {product.brand}
          </Text>
        )}

        {/* Ürün Adı */}
        <Text className="text-foreground font-semibold text-base" numberOfLines={2}>
          {product.name || 'İsimsiz Ürün'}
        </Text>

        {/* Gramaj */}
        {product.quantity && (
          <Text className="text-muted-foreground text-sm mt-0.5">
            {product.quantity}
          </Text>
        )}

        {/* Barkod ve Tarih */}
        <View className="flex-row items-center mt-1.5">
          <Text className="text-muted-foreground text-xs font-mono">
            🔢 {barcode}
          </Text>
          <Text className="text-muted-foreground text-xs mx-2">•</Text>
          <Text className="text-muted-foreground text-xs">
            {formatDateShort(viewedAt)}
          </Text>
        </View>
      </View>

      {/* Sağ Ok */}
      <View className="justify-center ml-2">
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colorScheme === 'dark' ? '#525252' : '#A3A3A3'}
        />
      </View>
    </TouchableOpacity>
  );
}
