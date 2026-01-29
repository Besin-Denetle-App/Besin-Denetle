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
 * Gizlilik Politikası Ekranı
 * Kullanıcıların kişisel verilerinin nasıl işlendiğini açıklar.
 */
export default function PrivacyScreen() {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
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
      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <Text className="text-foreground text-base leading-7 mb-6">
          Besin Denetle olarak gizliliğinize önem veriyoruz. Bu politika, uygulamamızı kullanırken kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
        </Text>

        <Section title="1. Toplanan Bilgiler">
          <ListItem dot>
            <Text className="font-bold">Kimlik Bilgileri:</Text> Kullanıcı adı ve şifrelenmiş OAuth kimlikleri (Google/Apple ID).
          </ListItem>
          <ListItem dot>
            <Text className="font-bold">İletişim Bilgileri:</Text> E-posta adresi.
          </ListItem>
          <ListItem dot>
            <Text className="font-bold">Kullanım Verileri:</Text> Taradığınız barkodlar, ürünlere ait raporlamalar.
          </ListItem>
          <ListItem dot>
            <Text className="font-bold">Cihaz Bilgileri:</Text> Uygulama sürümü, işletim sistemi versiyonu
          </ListItem>
        </Section>

        <Section title="2. Bilgilerin Kullanım Amacı">
          <Text className="text-muted-foreground text-base leading-6 mb-2">
            Topladığımız verileri şu amaçlarla kullanıyoruz:
          </Text>
          <ListItem>• Topluluk destekli doğrulama sistemini (oylama) işletmek.</ListItem>
          <ListItem>• Hesap güvenliğinizi sağlamak ve kötüye kullanımı önlemek.</ListItem>
          <ListItem>• Uygulama performansını analiz etmek ve geliştirmek.</ListItem>
        </Section>

        <Section title="3. Veri Paylaşımı">
          <Text className="text-muted-foreground text-base leading-6 mb-2">
            Kişisel verileriniz, yasal zorunluluklar dışında asla üçüncü şahıslarla paylaşılmaz. Verileriniz reklam veya pazarlama amacıyla satılmaz.
          </Text>
          <Text className="text-muted-foreground text-base leading-6 mb-2">
            Hiçbir kişisel veriniz yapay zeka modellerine gönderilmemektedir. AI analizleri yalnızca ürün barkodu ve içerik listesi gibi anonim ürün bilgileriyle gerçekleştirilir.
          </Text>
        </Section>

        <Section title="4. Veri Güvenliği">
          <Text className="text-muted-foreground text-base leading-6">
            Verileriniz endüstri standardı şifreleme yöntemleri (SSL/TLS) ile korunmaktadır. Kimlik doğrulama işlemleri OAuth 2.0 protokolü üzerinden güvenli bir şekilde gerçekleştirilir.
          </Text>
        </Section>

        <Section title="5. Veri Saklama Süresi">
          <Text className="text-muted-foreground text-base leading-6">
            Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir. Cihazınızdaki yerel veriler (tarama geçmişi) 40 gün sonra veya siz silene kadar saklanır.
          </Text>
        </Section>

        <Section title="6. Kullanıcı Hakları">
          <Text className="text-muted-foreground text-base leading-6 mb-2">
            Uygulama üzerinden dilediğiniz zaman:
          </Text>
          <ListItem>• Geçmiş taramalarınızı silebilirsiniz (Yerel verileri temizle).</ListItem>
          <ListItem>• Hesabınızı ve sunucudaki tüm verilerinizi silebilirsiniz.</ListItem>
        </Section>

        <Section title="7. İletişim">
          <Text className="text-muted-foreground text-base leading-6 mb-2">
            Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz:
          </Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "mailto:iletisim.furkancelik@gmail.com?subject=Besin%20Denetle%20Gizlilik%20Politikası"
              )
            }
          >
            <Text className="text-primary text-base font-semibold underline">
              iletisim.furkancelik@gmail.com
            </Text>
          </TouchableOpacity>
        </Section>

        <Text className="text-muted-foreground text-sm text-center mt-4 mb-8">
          Son Güncelleme: 25 Ocak 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Yardımcı Bileşenler
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-foreground font-bold text-lg mb-3">{title}</Text>
      <View>{children}</View>
    </View>
  );
}

function ListItem({ children, dot }: { children: React.ReactNode; dot?: boolean }) {
  return (
    <View className="flex-row mb-2">
      {dot && <Text className="text-foreground mr-2 text-base">•</Text>}
      <Text className="text-muted-foreground text-base leading-6 flex-1">
        {children}
      </Text>
    </View>
  );
}

