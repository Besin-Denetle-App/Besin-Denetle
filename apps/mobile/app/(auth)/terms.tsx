import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Kullanım Koşulları - Placeholder
 * TODO: Yazıldığı zaman onay alındığında gerçek içerik ile değiştir
 */
export default function TermsScreen() {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-background">
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
        <Text className="text-foreground text-lg font-bold ml-2">
          Kullanım Koşulları
        </Text>
      </View>

      {/* İçerik */}
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-foreground text-base leading-6 mb-4">
          Bu uygulama, kullanıcıların gıda ürünlerinin içeriklerini ve besin
          değerlerini görüntülemelerine yardımcı olmak amacıyla geliştirilmiştir.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          1. Kabul ve Onay
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Bu uygulamayı kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
          Koşulları kabul etmiyorsanız uygulamayı kullanmayınız.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          2. Hizmet Tanımı
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Besin Denetle, barkod tarama teknolojisi ve yapay zeka kullanarak
          ürün bilgilerini sunan bir mobil uygulamadır. Sunulan bilgiler
          yalnızca bilgilendirme amaçlıdır ve tıbbi tavsiye niteliği taşımaz.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          3. Kullanıcı Sorumlulukları
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Kullanıcılar, uygulamayı yalnızca yasal amaçlarla kullanmayı ve
          topluluk kurallarına uymayı kabul eder. Yanıltıcı veya hatalı bilgi
          girişi yasaktır.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          4. Sorumluluk Reddi
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Uygulama "olduğu gibi" sunulmaktadır. Sunulan bilgilerin doğruluğu
          garanti edilmez. Alerjik reaksiyonlar veya sağlık sorunları için
          lütfen ürün ambalajını kontrol edin ve bir sağlık uzmanına danışın.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          5. İletişim
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-8">
          Sorularınız için: destek@besindenetle.com
        </Text>

        <Text className="text-muted-foreground text-sm text-center mb-6">
          Son güncelleme: Ocak 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
