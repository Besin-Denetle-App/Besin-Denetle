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
 * Kullanım Koşulları
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
            color={colorScheme === "dark" ? "#E0E0E0" : "#212121"}
          />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-bold ml-2">
          Kullanım Koşulları
        </Text>
      </View>

      {/* İçerik */}
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-foreground text-base leading-6 mb-4">
          Besin Denetle uygulamasını kullanarak aşağıdaki koşulları kabul etmiş
          sayılırsınız.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          1. Uygulama Amacı
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Besin Denetle, barkod taratarak gıda ürünlerinin içeriklerini
          görüntülemenizi sağlar. Yapay zeka destekli analizler yalnızca
          bilgilendirme amaçlıdır.
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          2. Tıbbi Sorumluluk Reddi
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          {`Uygulama tıbbi tavsiye vermez. Alerji, diyet veya sağlık kararları için lütfen ürün ambalajını kontrol edin ve bir sağlık uzmanına danışın.`}
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          3. Kullanıcı Sorumlulukları
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          • Uygulamayı yalnızca yasal amaçlarla kullanın{"\n"}• Topluluk
          oylamalarında dürüst olun{"\n"}• Yanıltıcı bilgi girişi yapmayın
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          4. Bilgi Doğruluğu
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          {`Ürün bilgileri yapay zeka ve kullanıcı katkılarıyla oluşturulur. Bilgilerin %100 doğruluğu garanti edilmez. Kritik kararlar için her zaman ürün ambalajını kontrol edin.`}
        </Text>

        <Text className="text-foreground font-bold text-lg mb-2">
          5. Hesap ve Veriler
        </Text>
        <Text className="text-muted-foreground text-base leading-6 mb-4">
          Hesabınızı istediğiniz zaman silebilirsiniz. Hesap silindiğinde tüm
          verileriniz kalıcı olarak kaldırılır.
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
              "mailto:iletisim.furkancelik@gmail.com?subject=Besin%20Denetle%20App%20%7C%20Terms",
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
