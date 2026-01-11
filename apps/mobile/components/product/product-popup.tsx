import type { IProduct } from '@besin-denetle/shared';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { ProductImage } from './product-image';

interface ProductPopupProps {
  visible: boolean;
  product: IProduct | null;
  isLoading: boolean;
  mode?: 'confirm' | 'non-food';
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
  onFlag?: () => void;
}

/**
 * Ürün onay popup'ı
 * - confirm: Normal onay akışı (Evet/Hayır)
 * - non-food: Yiyecek/içecek olmayan ürün (Geri Dön/Bildir)
 */
export function ProductPopup({
  visible,
  product,
  isLoading,
  mode = 'confirm',
  onConfirm,
  onReject,
  onClose,
  onFlag,
}: ProductPopupProps) {
  const { colorScheme } = useColorScheme();
  const isNonFood = mode === 'non-food';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-card rounded-t-3xl px-6 pt-6 pb-8">
          {/* Kapat Butonu */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 w-10 h-10 items-center justify-center"
          >
            <Ionicons
              name="close"
              size={24}
              color={colorScheme === 'dark' ? '#A3A3A3' : '#737373'}
            />
          </TouchableOpacity>

          {/* Loading State */}
          {isLoading && (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="text-muted-foreground mt-4">
                Ürün bilgileri yükleniyor...
              </Text>
            </View>
          )}

          {/* Non-Food Uyarısı */}
          {!isLoading && isNonFood && (
            <>
              <View className="items-center mb-6">
                <View className="w-20 h-20 bg-amber-500/20 rounded-full items-center justify-center mb-4">
                  <Ionicons
                    name="warning"
                    size={40}
                    color="#F59E0B"
                  />
                </View>
                <Text className="text-foreground text-xl font-bold text-center">
                  Gıda Ürünü Değil
                </Text>
                <Text className="text-muted-foreground text-center mt-2 px-4">
                  Bu barkod yiyecek veya içecek kategorisinde değil.
                  Eğer bu bir gıda ürünüyse bildirebilirsiniz.
                </Text>
              </View>

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
                    color={colorScheme === 'dark' ? '#E0E0E0' : '#212121'}
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
                    color="#F59E0B"
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
                <ProductImage url={product.image_url} size={128} borderRadius={16} />
              </View>

              {/* Marka ve İsim */}
              <View className="items-center mb-6">
                {product.brand && (
                  <Text className="text-muted-foreground text-sm uppercase tracking-wider mb-1">
                    {product.brand}
                  </Text>
                )}
                <Text className="text-foreground text-xl font-bold text-center">
                  {product.name || 'İsimsiz Ürün'}
                </Text>
                {product.quantity && (
                  <Text className="text-muted-foreground text-base mt-1">
                    {product.quantity}
                  </Text>
                )}
              </View>

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
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
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
                    color={colorScheme === 'dark' ? '#EF5350' : '#D32F2F'}
                  />
                  <Text className="text-destructive font-bold text-base ml-2">
                    Hayır, Yanlış
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Ürün Bulunamadı */}
          {!isLoading && !isNonFood && !product && (
            <View className="items-center py-8">
              <Ionicons
                name="alert-circle-outline"
                size={64}
                color={colorScheme === 'dark' ? '#EF5350' : '#D32F2F'}
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
        </View>
      </View>
    </Modal>
  );
}
