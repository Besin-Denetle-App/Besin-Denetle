import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
            color={colorScheme === "dark" ? "#E0E0E0" : "#212121"}
          />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-2">
          Gizlilik Politikası
        </Text>
      </View>

      {/* İçerik */}
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-foreground text-base leading-6 mb-4">
          Bu politika, Besin Denetle uygulamasını kullanırken kişisel
          verilerinizin nasıl toplandığını ve kullanıldığını açıklar.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          1. Toplanan Veriler
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          • E-posta adresi ve kullanıcı adı (hesap oluşturmak için){"\n"}•
          Taranan barkodlar ve ürün oylamalarınız{"\n"}• Son aktiflik zamanı
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          2. Veri Kullanımı
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Verileriniz yalnızca uygulama hizmetlerini sunmak için kullanılır.
          Reklam veya pazarlama amacıyla üçüncü taraflarla paylaşılmaz.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          3. Veri Saklama
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Verileriniz sunucularımızda saklanır. Hesabınızı sildiğinizde tüm
          verileriniz anında kalıcı olarak silinir.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          4. Yerel Depolama
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          {`Oturum bilgileriniz (JWT token) cihazınızda güvenli şekilde saklanır. Tarama geçmişiniz cihazınızda yerel olarak tutulur.`}
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          5. Haklarınız
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Hesabınızı ve tüm verilerinizi istediğiniz zaman Ayarlar {">"}{" "}
          Gelişmiş Ayarlar {">"} Hesabımı Sil seçeneğinden silebilirsiniz.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          6. İletişim
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-1">
          Sorularınız için:
        </Text>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              "mailto:iletisim.furkancelik@gmail.com?subject=Besin%20Denetle%20App%20%7C%20Privacy",
            )
          }
          activeOpacity={0.7}
        >
          <Text className="text-primary text-base font-medium underline mb-6">
            iletisim.furkancelik@gmail.com
          </Text>
        </TouchableOpacity>

        <Text className="text-muted-foreground text-sm text-center mb-8">
          Son güncelleme: Ocak 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
