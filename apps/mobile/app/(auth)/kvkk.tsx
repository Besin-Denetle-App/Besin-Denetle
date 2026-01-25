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
 * KVKK Aydınlatma Metni Ekranı
 * Resmi ve yasal gerekliliklere uygun format.
 */
export default function KVKKScreen() {
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
                    KVKK Aydınlatma Metni
                </Text>
            </View>

            {/* İçerik */}
            <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
                <Text className="text-foreground text-base leading-7 mb-6">
                    6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Besin Denetle uygulaması ("Veri Sorumlusu") olarak, kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.
                </Text>

                <Section title="1. Veri Sorumlusu">
                    <Text className="text-muted-foreground text-base leading-6">
                        Besin Denetle Proje Ekibi olarak, kişisel verilerinizi KVKK kapsamında veri sorumlusu sıfatıyla aşağıda açıklanan amaçlar doğrultusunda işlemekteyiz.
                    </Text>
                </Section>

                <Section title="2. Kişisel Verilerin İşlenme Amacı">
                    <Text className="text-muted-foreground text-base leading-6 mb-2">
                        Toplanan kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
                    </Text>
                    <ListItem dot>Kullanıcı kaydının oluşturulması ve hesap güvenliğinin sağlanması.</ListItem>
                    <ListItem dot>Ürün sorgulama ve analiz hizmetlerinin sunulması.</ListItem>
                    <ListItem dot>Hatalı ürün bildirimlerinin (crowdsourcing) doğrulanması.</ListItem>
                    <ListItem dot>Yasal yükümlülüklerin yerine getirilmesi.</ListItem>
                </Section>

                <Section title="3. İşlenen Kişisel Veri Kategorileri">
                    <ListItem dot>
                        <Text className="font-bold">Kimlik:</Text> Kullanıcı ID, Kullanıcı Adı.
                    </ListItem>
                    <ListItem dot>
                        <Text className="font-bold">İletişim:</Text> E-posta adresi.
                    </ListItem>
                    <ListItem dot>
                        <Text className="font-bold">İşlem Güvenliği:</Text> IP adresi kayıtları, giriş-çıkış bilgileri, şifreleme anahtarları.
                    </ListItem>
                </Section>

                <Section title="4. Kişisel Verilerin Aktarılması">
                    <Text className="text-muted-foreground text-base leading-6">
                        Kişisel verileriniz, kanuni zorunluluklar (adli makamlar vb.) dışında açık rızanız olmaksızın üçüncü kişilere aktarılmaz. Sunucularımızda saklanan veriler, teknik altyapı sağlayıcıları ile veri güvenliği sözleşmeleri çerçevesinde işlenir.
                    </Text>
                </Section>

                <Section title="5. Veri Toplamanın Yöntemi ve Hukuki Sebebi">
                    <Text className="text-muted-foreground text-base leading-6">
                        Kişisel verileriniz, mobil uygulama üzerinden elektronik ortamda, KVKK m.5/2-c (sözleşmenin kurulması) ve m.5/2-f (meşru menfaat) hukuki sebeplerine dayalı olarak toplanmaktadır.
                    </Text>
                </Section>

                <Section title="6. İlgili Kişinin Hakları (Madde 11)">
                    <Text className="text-muted-foreground text-base leading-6 mb-2">
                        KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                    </Text>
                    <ListItem dot>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</ListItem>
                    <ListItem dot>İşlenmişse buna ilişkin bilgi talep etme,</ListItem>
                    <ListItem dot>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</ListItem>
                    <ListItem dot>Yurt içinde veya yurt dışında üçüncü kişilere aktarılıp aktarılmadığını bilme,</ListItem>
                    <ListItem dot>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</ListItem>
                    <ListItem dot>KVKK m.7 uyarınca silinmesini veya yok edilmesini isteme.</ListItem>
                </Section>

                <Section title="7. Başvuru ve İletişim">
                    <Text className="text-muted-foreground text-base leading-6 mb-2">
                        KVKK kapsamındaki haklarınızı kullanmakla ilgili taleplerinizi aşağıdaki e-posta adresi üzerinden bize iletebilirsiniz:
                    </Text>
                    <TouchableOpacity
                        onPress={() =>
                            Linking.openURL(
                                "mailto:iletisim.furkancelik@gmail.com?subject=KVKK%20Başvuru%20Talebi"
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

