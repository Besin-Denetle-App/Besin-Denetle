import { HealthScore, NutritionTable, ProductImage } from '@/components/product';
import { Skeleton } from '@/components/ui/skeleton';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductDetails } from '../../hooks/use-product-details';
import { useProductStore } from '../../stores/product.store';

export default function ProductDetailScreen() {
  const { id, readonly } = useLocalSearchParams<{ id: string; readonly?: string }>();
  const isReadonly = readonly === 'true'; // Geçmişten açıldıysa salt okunur
  const { colorScheme } = useColorScheme();
  const pagerRef = useRef<PagerView>(null);

  // Store'dan product ve barcode al
  const { currentProduct: product, currentBarcode: barcode } = useProductStore();

  // Custom hook ile API logic'i
  const {
    content,
    analysis,
    isLoading,
    error,
    rejectContent,
    rejectAnalysis,
  } = useProductDetails(id!, isReadonly);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Tab değiştiğinde
  const handlePageChange = (e: { nativeEvent: { position: number } }) => {
    setActiveTab(e.nativeEvent.position);
  };

  // Tab'a tıklandığında
  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
    setActiveTab(index);
  };

  // Loading durumu - Skeleton
  if (isLoading && !product) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Header Skeleton */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <Skeleton width={40} height={40} borderRadius={8} />
          <Skeleton width={120} height={20} className="ml-2" />
        </View>

        {/* Tab Bar Skeleton */}
        <View className="flex-row border-b border-border py-4">
          <View className="flex-1 items-center">
            <Skeleton width={100} height={16} />
          </View>
          <View className="flex-1 items-center">
            <Skeleton width={80} height={16} />
          </View>
        </View>

        {/* Content Skeleton */}
        <View className="p-4">
          {/* Ürün Resmi */}
          <View className="items-center mb-6">
            <Skeleton width={128} height={128} borderRadius={16} />
            <Skeleton width={80} height={12} className="mt-4" />
            <Skeleton width={200} height={20} className="mt-2" />
            <Skeleton width={60} height={14} className="mt-2" />
          </View>

          {/* İçindekiler */}
          <Skeleton width={100} height={18} className="mb-3" />
          <View className="gap-2">
            <Skeleton width="100%" height={60} borderRadius={16} />
            <Skeleton width="100%" height={60} borderRadius={16} />
          </View>

          {/* Besin Tablosu */}
          <Skeleton width={120} height={18} className="mt-6 mb-3" />
          <Skeleton width="100%" height={200} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  // Hata durumu
  if (error && !product) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF5350" />
        <Text className="text-foreground text-lg font-bold mt-4">Hata</Text>
        <Text className="text-muted-foreground text-center mt-2">{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary mt-6 px-8 py-3 rounded-full"
        >
          <Text className="text-primary-foreground font-semibold">Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colorScheme === 'dark' ? '#E0E0E0' : '#212121'}
          />
        </TouchableOpacity>
        <Text className="text-foreground font-semibold text-lg ml-2 flex-1" numberOfLines={1}>
          Ürün Detayı
        </Text>
      </View>

      {/* Tab Bar */}
      <View className="flex-row border-b border-border">
        {['Ürün + İçerik', 'AI Özeti'].map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabPress(index)}
            className={`flex-1 py-4 items-center ${
              activeTab === index ? 'border-b-2 border-primary' : ''
            }`}
          >
            <Text
              className={`font-medium ${
                activeTab === index ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipe Pages */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {/* Sayfa 1: Ürün + İçindekiler */}
        <ScrollView key="1" className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Ürün Bilgileri */}
          <View className="items-center mb-6">
            <View className="mb-4">
              <ProductImage url={product?.image_url} size={128} borderRadius={16} />
            </View>
            
            {product?.brand && (
              <Text className="text-muted-foreground text-sm uppercase tracking-wider">
                {product.brand}
              </Text>
            )}
            <Text className="text-foreground text-xl font-bold text-center mt-1">
              {product?.name || 'İsimsiz Ürün'}
            </Text>
            {product?.quantity && (
              <Text className="text-muted-foreground mt-1">{product.quantity}</Text>
            )}
            {/* Barkod Numarası */}
            {barcode && (
              <View className="mt-3 bg-secondary/30 px-4 py-2 rounded-full">
                <Text className="text-muted-foreground font-mono text-sm">
                  🔢 {barcode}
                </Text>
              </View>
            )}
          </View>

          {/* İçindekiler */}
          {content?.ingredients && (
            <View className="mb-6">
              <Text className="text-foreground font-semibold text-lg mb-3">
                İçindekiler
              </Text>
              <View className="bg-card border border-border rounded-2xl p-4">
                <Text className="text-foreground leading-6">{content.ingredients}</Text>
              </View>
            </View>
          )}

          {/* Alerjenler */}
          {content?.allergens && (
            <View className="mb-6">
              <Text className="text-foreground font-semibold text-lg mb-3">
                Alerjenler
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {content.allergens.split(',').map((allergen, index) => (
                  <View
                    key={index}
                    className="bg-orange-500/20 border border-orange-500/30 px-3 py-1 rounded-full"
                  >
                    <Text className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                      {allergen.trim()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Besin Tablosu */}
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-lg mb-3">
              Besin Değerleri
            </Text>
            <NutritionTable nutrition={content?.nutrition_table || null} />
          </View>

          {/* Hatalı Butonu - Salt okunur modda gösterme */}
          {!isReadonly && (
            <TouchableOpacity
              onPress={rejectContent}
              disabled={isLoading}
              className="bg-destructive/10 border border-destructive/20 py-4 rounded-2xl items-center mb-8"
            >
              <Text className="text-destructive font-semibold">
                İçindekiler Hatalı
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Sayfa 2: AI Özeti */}
        <ScrollView key="2" className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {analysis?.analysis_text ? (
            <>
              {/* Health Score */}
              <View className="items-center mb-8">
                <HealthScore score={analysis.analysis_text.healthScore} />
              </View>

              {/* Özet */}
              <View className="mb-6">
                <Text className="text-foreground font-semibold text-lg mb-3">
                  Özet
                </Text>
                <View className="bg-card border border-border rounded-2xl p-4">
                  <Text className="text-foreground leading-6">
                    {analysis.analysis_text.summary}
                  </Text>
                </View>
              </View>

              {/* Uyarılar */}
              {analysis.analysis_text.warnings.length > 0 && (
                <View className="mb-6">
                  <Text className="text-foreground font-semibold text-lg mb-3">
                    ⚠️ Dikkat Edilmesi Gerekenler
                  </Text>
                  <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    {analysis.analysis_text.warnings.map((warning, index) => (
                      <View key={index} className="flex-row items-start mb-2 last:mb-0">
                        <Text className="text-red-500 mr-2">•</Text>
                        <Text className="text-red-600 dark:text-red-400 flex-1">
                          {warning}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Olumlu Yönler */}
              {analysis.analysis_text.positives.length > 0 && (
                <View className="mb-6">
                  <Text className="text-foreground font-semibold text-lg mb-3">
                    ✅ Olumlu Yönler
                  </Text>
                  <View className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    {analysis.analysis_text.positives.map((positive, index) => (
                      <View key={index} className="flex-row items-start mb-2 last:mb-0">
                        <Text className="text-green-500 mr-2">•</Text>
                        <Text className="text-green-600 dark:text-green-400 flex-1">
                          {positive}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Öneri */}
              <View className="mb-6">
                <Text className="text-foreground font-semibold text-lg mb-3">
                  💡 Öneri
                </Text>
                <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                  <Text className="text-primary">
                    {analysis.analysis_text.recommendation}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              {isLoading ? (
                <>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text className="text-muted-foreground mt-4">AI analizi yükleniyor...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="analytics-outline"
                    size={64}
                    color={colorScheme === 'dark' ? '#404040' : '#D4D4D4'}
                  />
                  <Text className="text-muted-foreground mt-4 text-center">
                    AI analizi bulunamadı
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Beğenmedim Butonu - Salt okunur modda gösterme */}
          {analysis && !isReadonly && (
            <TouchableOpacity
              onPress={rejectAnalysis}
              disabled={isLoading}
              className="bg-destructive/10 border border-destructive/20 py-4 rounded-2xl items-center mb-8"
            >
              <Text className="text-destructive font-semibold">
                AI Özeti Hatalı
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </PagerView>
    </SafeAreaView>
  );
}
