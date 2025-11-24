import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 bg-background px-4 pt-4">
        {/* Başlık Alanı */}
        <View className="mb-6 mt-2">
          <Text className="text-3xl font-bold text-foreground">Besin Denetle</Text>
          <Text className="text-muted-foreground text-base">Sağlıklı seçimler yapın</Text>
        </View>

        {/* Arama Çubuğu */}
        <View className="flex-row items-center bg-secondary/50 rounded-2xl px-4 py-3 border border-border">
          <Ionicons name="search" size={24} className="text-muted-foreground" color={colorScheme === 'dark' ? '#A3A3A3' : '#737373'} />
          <TextInput
            placeholder="Ürün ara (örn. Süt, Çikolata)"
            className="flex-1 ml-3 text-foreground text-base"
            placeholderTextColor={colorScheme === 'dark' ? '#A3A3A3' : '#737373'}
          />
        </View>

        {/* İçerik Yer Tutucu */}
        <View className="flex-1 items-center justify-center">
          <Ionicons name="nutrition-outline" size={64} color={colorScheme === 'dark' ? '#404040' : '#E5E5E5'} />
          <Text className="text-muted-foreground mt-4 text-center">
            Barkod taratın veya ürün arayın
          </Text>
        </View>
      </View>

      {/* Tema Değiştirme Butonu - Sağ Alt Köşe Sabit */}
      <TouchableOpacity
        onPress={toggleColorScheme}
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <Ionicons name={colorScheme === 'dark' ? "sunny" : "moon"} size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
