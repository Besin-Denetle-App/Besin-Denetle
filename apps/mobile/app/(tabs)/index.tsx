import { HistoryCard } from "@/components/product";
import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDebouncedNavigation } from "../../hooks/use-debounce";
import { useHapticsStore } from "../../stores/haptics.store";
import { useHistoryStore, type HistoryItem } from "../../stores/history.store";
import { useProductStore } from "../../stores/product.store";

export default function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const { history, isLoading, loadHistory } = useHistoryStore();
  const { setProduct, setBarcode, setContent, setAnalysis } = useProductStore();
  const selection = useHapticsStore((state) => state.selection);
  const { navigate } = useDebouncedNavigation();

  // Arama state
  const [searchQuery, setSearchQuery] = useState("");

  // Uygulama başlangıcında geçmişi yükle
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Filtrelenmiş geçmiş (barkod, marka, isim, gramaj üzerinde arama)
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;

    const query = searchQuery.toLowerCase().trim();
    return history.filter((item) => {
      const { product, barcode } = item;
      return (
        barcode.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.name?.toLowerCase().includes(query) ||
        product.quantity?.toLowerCase().includes(query)
      );
    });
  }, [history, searchQuery]);

  // Geçmiş kartına tıklandığında (debounced - çift tıklama engellenir)
  const handleHistoryPress = (item: HistoryItem) => {
    selection(); // Hafif titreşim
    // Store'a verileri yükle
    setProduct(item.product);
    setBarcode(item.barcode);
    setContent(item.content);
    setAnalysis(item.analysis);

    // Salt okunur modda detay sayfasına git
    navigate(`/product/${item.id}?readonly=true`);
  };

  // Boş liste komponenti
  const EmptyList = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Ionicons
        name={searchQuery ? "search-outline" : "time-outline"}
        size={64}
        color={colorScheme === "dark" ? "#404040" : "#E5E5E5"}
      />
      <Text className="text-muted-foreground mt-4 text-center px-8">
        {searchQuery
          ? `"${searchQuery}" için sonuç bulunamadı.`
          : `Geçmiş aramalarınız burada görünecek.\nBaşlamak için barkod taratın.`}
      </Text>
    </View>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <View className="px-4">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="flex-row bg-card border border-border rounded-2xl p-3 mb-3"
        >
          <Skeleton width={80} height={80} borderRadius={12} />
          <View className="flex-1 ml-3 justify-center">
            <Skeleton width={60} height={12} className="mb-2" />
            <Skeleton width="80%" height={16} className="mb-2" />
            <Skeleton width={100} height={14} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Başlık Alanı */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-3xl font-bold text-foreground mb-2">
          Besin Denetle
        </Text>
        <Text className="text-muted-foreground text-base mb-2">
          Daha sağlıklı bir yaşam için seçimlerinizi doğru yapın
        </Text>
      </View>

      {/* Arama Çubuğu */}
      <View className="px-6 py-2">
        <View className="flex-row items-center bg-secondary/50 rounded-2xl px-4 py-3 border border-primary/50">
          <Ionicons
            name="search"
            size={20}
            color={colorScheme === "dark" ? "#A3A3A3" : "#737373"}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Geçmişte ara (barkod, marka, isim...)"
            className="flex-1 ml-3 text-foreground text-base"
            placeholderTextColor={
              colorScheme === "dark" ? "#A3A3A3" : "#737373"
            }
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colorScheme === "dark" ? "#525252" : "#A3A3A3"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Geçmiş Başlığı */}
      {filteredHistory.length > 0 && (
        <View className="flex-row items-center justify-between px-6 py-2">
          <Text className="text-foreground font-semibold text-lg">
            {searchQuery ? "Sonuçlar" : "Son Aramalar"}
          </Text>
          <Text className="text-muted-foreground text-sm">
            {filteredHistory.length} ürün
          </Text>
        </View>
      )}

      {/* Geçmiş Listesi */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryCard item={item} onPress={() => handleHistoryPress(item)} />
          )}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          ListEmptyComponent={<EmptyList />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
