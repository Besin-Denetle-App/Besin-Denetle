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
 * KVKK Aydınlatma Metni
 */
export default function KVKKScreen() {
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
                    KVKK Aydınlatma Metni
                </Text>
            </View>

            {/* İçerik */}
            <ScrollView className="flex-1 px-6 py-6">
                <Text className="text-foreground text-base leading-6 mb-4">
                    6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, kişisel
                    verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.
                </Text>

                <Text className="text-foreground font-bold text-lg mb-2">
                    1. Veri Sorumlusu
                </Text>
                <Text className="text-muted-foreground text-base leading-6 mb-4">
                    Veri sorumlusu olarak Besin Denetle uygulaması, kişisel verilerinizi
                    aşağıda açıklanan amaçlar doğrultusunda işlemektedir.
                </Text>

                <Text className="text-foreground font-bold text-lg mb-2">
                    2. İşlenen Kişisel Veriler
                </Text>
                <Text className="text-muted-foreground text-base leading-6 mb-4">
                    • Kimlik Bilgileri: Kullanıcı adı, e-posta adresi{"\n"}• İşlem
                    Güvenliği: Oturum bilgileri, IP adresi{"\n"}• Uygulama Kullanım
                    Verileri: Taranan barkodlar, ürün oylamaları
                </Text>

                <Text className="text-foreground font-bold text-lg mb-2">
                    3. Veri İşleme Amaçları
                </Text>
                <Text className="text-muted-foreground text-base leading-6 mb-4">
                    • Uygulama hizmetlerinin sunulması{"\n"}• Kullanıcı hesabının
                    oluşturulması ve yönetimi{"\n"}• Ürün bilgilerinin kişiselleştirilmesi
                    {"\n"}• Yasal yükümlülüklerin yerine getirilmesi
                </Text>

                <Text className="text-foreground font-bold text-lg mb-2">
                    4. Veri Aktarımı
                </Text>
                <Text className="text-muted-foreground text-base leading-6 mb-4">
                    Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla
                    paylaşılmaz. Verileriniz reklam veya pazarlama amacıyla
                    kullanılmamaktadır.
                </Text>

                <Text className="text-foreground font-bold text-lg mb-2">
                    5. Veri Saklama Süresi
                </Text>
                <Text className="text-muted-foreground text-base leading-6 mb-4">
                    Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap
                    silme talebiniz halinde tüm verileriniz derhal ve kalıcı olarak
                    silinir.
                </Text>

                <Text className="text-foreground font-bold text-lg mb-2">
                    6. Haklarınız (KVKK m.11)
                </Text>
                <Text className="text-muted-foreground text-base leading-6 mb-4">
                    • Kişisel verilerinizin işlenip işlenmediğini öğrenme{"\n"}• İşleme
                    amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme{"\n"}•
                    Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme{"\n"}• Eksik
                    veya yanlış işlenmişse düzeltilmesini isteme{"\n"}• Silinmesini veya
                    yok edilmesini isteme{"\n"}• İşlenen verilerin münhasıran otomatik
                    sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir
                    sonucun ortaya çıkmasına itiraz etme
                </Text>

                <Text className="text-foreground font-bold text-lg mb-2">
                    7. İletişim
                </Text>
                <Text className="text-muted-foreground text-base leading-6 mb-1">
                    KVKK kapsamındaki başvurularınız için:
                </Text>
                <TouchableOpacity
                    onPress={() =>
                        Linking.openURL(
                            "mailto:iletisim.furkancelik@gmail.com?subject=Besin%20Denetle%20App%20%7C%20KVKK",
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
