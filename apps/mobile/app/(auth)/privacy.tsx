import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Gizlilik Politikası - Placeholder
 * TODO: gerçek içerik ile güncellenecek KVKK uyumlu metin alındığında güncelle
 */
export default function PrivacyScreen() {
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
          Gizlilik Politikası
        </Text>
      </View>

      {/* İçerik */}
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-foreground text-base leading-6 mb-4">
          Gizliliğiniz bizim için önemlidir. Bu politika, kişisel verilerinizin
          nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          1. Toplanan Veriler
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          - E-posta adresi (OAuth ile giriş için){'\n'}
          - Kullanıcı adı{'\n'}
          - Taranan barkodlar ve oylama geçmişi
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          2. Veri Kullanımı
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Verileriniz yalnızca uygulama hizmetlerini sunmak ve iyileştirmek
          amacıyla kullanılır. Verilerinizi üçüncü taraflarla paylaşmıyoruz.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          3. Veri Güvenliği
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Verileriniz şifrelenerek saklanır ve endüstri standardı güvenlik
          önlemleriyle korunur.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          4. Çerezler ve Takip
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          {`Bu uygulama üçüncü taraf izleme araçları kullanmaz. Oturum yönetimi için yalnızca gerekli token'lar cihazınızda saklanır.`}
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          5. Haklarınız
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          KVKK kapsamında verilerinize erişim, düzeltme ve silme haklarına
          sahipsiniz. Talepleriniz için bizimle iletişime geçebilirsiniz.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          6. İletişim
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-8">
          Gizlilik ile ilgili sorularınız için: gizlilik@besindenetle.com
        </Text>

        <Text className="text-muted-foreground text-sm text-center mb-6">
          Son güncelleme: Ocak 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
