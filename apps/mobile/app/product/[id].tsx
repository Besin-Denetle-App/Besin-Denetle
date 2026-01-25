import {
  HealthScore,
  NovaGroup,
  NutritionTable,
  ProductImage,
} from "@/components/product";
import { Skeleton } from "@/components/ui/skeleton";
import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProductDetails } from "../../hooks/use-product-details";
import { useProductStore } from "../../stores/product.store";

export default function ProductDetailScreen() {
  const { id, readonly } = useLocalSearchParams<{
    id: string;
    readonly?: string;
  }>();
  const isReadonly = readonly === "true";
  const { colorScheme } = useColorScheme();

  // Tema renklerini merkezi dosyadan al
  const themeColors = colorScheme === "dark" ? COLORS.dark : COLORS.light;
  const pagerRef = useRef<PagerView>(null);
  const contentScrollRef = useRef<ScrollView>(null);
  const aiScrollRef = useRef<ScrollView>(null);

  // Store'dan urun ve barkod bilgisini al
  const { currentProduct: product, currentBarcode: barcode } =
    useProductStore();

  // API logic - custom hook
  const {
    content,
    analysis,
    isLoading,
    isAnalysisLoading,
    analysisError,
    error,
    rejectContent,
    rejectAnalysis,
    retryAnalysis,
  } = useProductDetails(id!, isReadonly);

  // Tab durumu
  const [activeTab, setActiveTab] = useState(0);
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();
  const tabWidth = windowWidth / 2;

  // Tab degistiginde indicator animasyonu
  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
    setActiveTab(index);
    Animated.spring(tabIndicatorPosition, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  // Swipe ile sayfa degistiginde
  const handlePageChange = (e: { nativeEvent: { position: number } }) => {
    const newIndex = e.nativeEvent.position;
    setActiveTab(newIndex);
    Animated.spring(tabIndicatorPosition, {
      toValue: newIndex * tabWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  // Analiz degistiginde scroll'u uste al
  useEffect(() => {
    if (analysis && aiScrollRef.current) {
      aiScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [analysis]);

  // Icerik degistiginde scroll'u uste al
  useEffect(() => {
    if (content && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [content]);

  // Loading durumu - Skeleton
  if (isLoading && !product) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
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
            {/* Barkod */}
            <Skeleton
              width={140}
              height={28}
              borderRadius={14}
              className="mt-3"
            />
          </View>

          {/* İçindekiler */}
          <Skeleton width={100} height={18} className="mb-3" />
          <Skeleton width="100%" height={80} borderRadius={16} />

          {/* Alerjenler */}
          <Skeleton width={90} height={18} className="mt-6 mb-3" />
          <View className="flex-row gap-2">
            <Skeleton width={70} height={28} borderRadius={14} />
            <Skeleton width={60} height={28} borderRadius={14} />
            <Skeleton width={80} height={28} borderRadius={14} />
          </View>

          {/* Besin Tablosu */}
          <Skeleton width={120} height={18} className="mt-6 mb-3" />
          <Skeleton width="100%" height={180} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  // Hata durumu
  if (error && !product) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={COLORS.semantic.error.dark}
        />
        <Text className="text-foreground text-lg font-bold mt-4">Hata</Text>
        <Text className="text-muted-foreground text-center mt-2">{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary mt-6 px-8 py-3 rounded-full"
        >
          <Text className="text-primary-foreground font-semibold">
            Geri Dön
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={themeColors.foreground}
          />
        </TouchableOpacity>
        <Text
          className="text-foreground font-semibold text-lg ml-2 flex-1"
          numberOfLines={1}
        >
          Ürün Detayı
        </Text>
      </View>

      {/* Tab Bar */}
      <View className="border-b border-border">
        <View className="flex-row">
          {["Ürün Bilgileri", "AI Analizi"].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabPress(index)}
              className="flex-1 py-4 items-center flex-row justify-center"
            >
              <Text
                className={`font-medium ${activeTab === index ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {tab}
              </Text>
              {/* AI Analizi tab'ında loading badge */}
              {index === 1 && isAnalysisLoading && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={{ marginLeft: 6 }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {/* Animated Indicator */}
        <Animated.View
          className="h-0.5 bg-primary absolute bottom-0"
          style={{
            width: tabWidth,
            transform: [{ translateX: tabIndicatorPosition }],
          }}
        />
      </View>

      {/* Swipe Pages */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {/* Sayfa 1: Ürün + İçindekiler */}
        <ScrollView
          ref={contentScrollRef}
          key="1"
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
        >
          {/* Ürün Bilgileri */}
          <View className="items-center mb-6">
            <View className="mb-4">
              <ProductImage
                url={product?.image_url}
                size={128}
                borderRadius={16}
              />
            </View>

            {product?.brand && (
              <Text className="text-muted-foreground text-sm uppercase tracking-wider">
                {product.brand}
              </Text>
            )}
            <Text className="text-foreground text-xl font-bold text-center mt-1">
              {product?.name || "İsimsiz Ürün"}
            </Text>
            {product?.quantity && (
              <Text className="text-muted-foreground mt-1">
                {product.quantity}
              </Text>
            )}
            {/* Barkod Numarası */}
            {barcode && (
              <View className="mt-3 bg-secondary/30 px-4 py-2 rounded-full flex-row items-center">
                <Ionicons
                  name="barcode-outline"
                  size={14}
                  color={themeColors.muted}
                />
                <Text className="text-muted-foreground font-mono text-sm ml-1">
                  {barcode}
                </Text>
              </View>
            )}
          </View>

          {/* İçindekiler */}
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-lg mb-3">
              İçindekiler
            </Text>
            {isLoading && !content ? (
              <View className="bg-card border border-border rounded-2xl p-4 items-center py-8">
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text className="text-muted-foreground mt-2 text-sm">
                  AI içerik çıkarıyor...
                </Text>
              </View>
            ) : content?.ingredients ? (
              <View className="bg-card border border-border rounded-2xl p-4">
                <Text className="text-foreground leading-6">
                  {content.ingredients}
                </Text>
              </View>
            ) : (
              <View className="bg-card border border-border rounded-2xl p-6 items-center">
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color={themeColors.muted}
                />
                <Text className="text-muted-foreground mt-2 text-center">
                  İçerik bilgisi bulunamadı
                </Text>
              </View>
            )}
          </View>

          {/* Alerjenler */}
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-lg mb-3">
              Alerjenler
            </Text>
            {isLoading && !content ? (
              <View className="bg-card border border-border rounded-2xl p-4 items-center py-6">
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : content?.allergens ? (
              <View className="flex-row flex-wrap gap-2">
                {content.allergens.split(",").map((allergen, index) => (
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
            ) : (
              <View className="bg-card border border-border rounded-2xl p-6 items-center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={32}
                  color={COLORS.semantic.successAlt}
                />
                <Text className="text-green-600 dark:text-green-400 mt-2 font-medium">
                  Alerjen içermiyor
                </Text>
              </View>
            )}
          </View>

          {/* Besin Tablosu */}
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-lg mb-3">
              Besin Değerleri
            </Text>
            {isLoading && !content ? (
              <View className="bg-card border border-border rounded-2xl p-4 items-center py-8">
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text className="text-muted-foreground mt-2 text-sm">
                  Besin değerleri yükleniyor...
                </Text>
              </View>
            ) : (
              <NutritionTable nutrition={content?.nutrition_table || null} />
            )}
          </View>

          {/* AI Model ve Tarih Bilgisi */}
          {content && (
            <View className="flex-row items-center justify-center py-4 border-t border-border mb-4">
              {content.nutrition_table?._source && (
                <>
                  <Text className="text-muted-foreground text-sm">
                    🤖 {content.nutrition_table._source}
                  </Text>
                  <Text className="text-muted-foreground text-sm mx-2">|</Text>
                </>
              )}
              <Text className="text-muted-foreground text-sm">
                📅{" "}
                {new Date(content.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}

          {/* Hatalı Butonu - Salt okunur modda gösterme */}
          {!isReadonly && (
            <TouchableOpacity
              onPress={rejectContent}
              disabled={isLoading}
              className={`py-4 rounded-2xl items-center mb-8 ${isLoading
                  ? "bg-muted border border-border"
                  : "bg-destructive/10 border border-destructive/20"
                }`}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text className="text-muted-foreground font-semibold ml-2">
                    Yeni içerik yükleniyor...
                  </Text>
                </View>
              ) : (
                <Text className="text-destructive font-semibold">
                  AI Yeniden İçerik Çıkarsın
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Sayfa 2: AI Özeti */}
        <ScrollView
          ref={aiScrollRef}
          key="2"
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
        >
          {analysis?.analysis_text ? (
            <>
              {/* Health Score ve Nova Group */}
              <View className="flex-row items-center justify-center gap-8 mb-8">
                <HealthScore score={analysis.analysis_text.healthScore} />
                {analysis.analysis_text.novaGroup && (
                  <NovaGroup group={analysis.analysis_text.novaGroup} />
                )}
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
                      <View
                        key={index}
                        className="flex-row items-start mb-2 last:mb-0"
                      >
                        <Text className="text-red-500 mr-2">•</Text>
                        <Text className="text-red-600 dark:text-red-400 flex-1">
                          {warning}
                        </Text>
                      </View>
                    ))}
                    {/* Detaylı açıklama */}
                    {analysis.analysis_text.warning_summary && (
                      <Text className="text-red-600/80 dark:text-red-400/80 text-sm mt-3 pt-3 border-t border-red-500/20">
                        {analysis.analysis_text.warning_summary}
                      </Text>
                    )}
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
                      <View
                        key={index}
                        className="flex-row items-start mb-2 last:mb-0"
                      >
                        <Text className="text-green-500 mr-2">•</Text>
                        <Text className="text-green-600 dark:text-green-400 flex-1">
                          {positive}
                        </Text>
                      </View>
                    ))}
                    {/* Detaylı açıklama */}
                    {analysis.analysis_text.positive_summary && (
                      <Text className="text-green-600/80 dark:text-green-400/80 text-sm mt-3 pt-3 border-t border-green-500/20">
                        {analysis.analysis_text.positive_summary}
                      </Text>
                    )}
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

              {/* AI Model ve Tarih Bilgisi */}
              <View className="flex-row items-center justify-center py-4 border-t border-border mt-2">
                <Text className="text-muted-foreground text-sm">
                  🤖 {analysis.analysis_text.model}
                </Text>
                <Text className="text-muted-foreground text-sm mx-2">|</Text>
                <Text className="text-muted-foreground text-sm">
                  📅{" "}
                  {new Date(analysis.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>

              {/* Loading Overlay - Yeni analiz yüklenirken */}
              {isAnalysisLoading && (
                <View className="absolute inset-0 bg-background/70 items-center justify-center rounded-2xl">
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text className="text-foreground font-medium mt-3">
                    Yeni analiz yükleniyor...
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              {isAnalysisLoading ? (
                <>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text className="text-muted-foreground mt-4">
                    AI analizi yükleniyor...
                  </Text>
                </>
              ) : analysisError ? (
                <>
                  <Ionicons
                    name="warning-outline"
                    size={64}
                    color={COLORS.semantic.errorAlt}
                  />
                  <Text className="text-muted-foreground mt-4 text-center">
                    Analiz yüklenemedi
                  </Text>
                  <TouchableOpacity
                    onPress={retryAnalysis}
                    className="mt-4 bg-primary px-6 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold">
                      Tekrar Dene
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons
                    name="analytics-outline"
                    size={64}
                    color={themeColors.divider}
                  />
                  <Text className="text-muted-foreground mt-4 text-center">
                    AI analizi bekleniyor...
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Beğenmedim Butonu - Salt okunur modda gösterme */}
          {analysis && !isReadonly && (
            <TouchableOpacity
              onPress={rejectAnalysis}
              disabled={isLoading || isAnalysisLoading}
              className={`py-4 rounded-2xl items-center mb-8 ${isAnalysisLoading
                  ? "bg-muted border border-border"
                  : "bg-destructive/10 border border-destructive/20"
                }`}
            >
              {isAnalysisLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text className="text-muted-foreground font-semibold ml-2">
                    Yeni analiz yükleniyor...
                  </Text>
                </View>
              ) : (
                <Text className="text-destructive font-semibold">
                  AI Yeniden Analiz Yapsın
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </PagerView>
    </SafeAreaView>
  );
}
