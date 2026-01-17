import { showInfoToast } from "@/components/feedback";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/auth.store";
import { useHapticsStore } from "../../stores/haptics.store";
import { useHistoryStore } from "../../stores/history.store";
import { useThemeStore, type ThemeMode } from "../../stores/theme.store";

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const { user, logout, deleteAccount } = useAuthStore();
  const { clearHistory, history } = useHistoryStore();
  const {
    enabled: hapticEnabled,
    setEnabled: setHapticEnabled,
    selection,
    heavy,
    success,
    error,
  } = useHapticsStore();
  const [isClearing, setIsClearing] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();

  // Geri sayım temizliği
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleLogout = () => {
    heavy();
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => {
            heavy();
            logout();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    heavy();
    // 1. İlk onay
    Alert.alert(
      "⚠️ Hesabı Sil",
      "Bu işlem GERİ ALINAMAZ!\n\nHesabınız ve tüm verileriniz kalıcı olarak silinecek.\n\nDevam etmek istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Devam Et",
          style: "destructive",
          onPress: () => {
            // 2. İkinci onay
            heavy();
            Alert.alert(
              "🚨 Son Uyarı",
              "Hesabınızı silmek istediğinizden EMİN misiniz?\n\nBu işlem geri alınamaz ve tüm verileriniz kaybolacak.",
              [
                { text: "Hayır, Vazgeç", style: "cancel" },
                {
                  text: "Evet, Hesabımı Sil",
                  style: "destructive",
                  onPress: startDeleteCountdown,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const startDeleteCountdown = () => {
    setIsDeleting(true);
    setDeleteCountdown(5);

    countdownRef.current = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          // performDelete callback içinde çağrılamaz - useEffect ile yapılacak
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Countdown sıfırlandığında silme işlemini başlat
  useEffect(() => {
    if (isDeleting && deleteCountdown === 0) {
      performDelete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteCountdown, isDeleting]);

  const cancelDelete = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsDeleting(false);
    setDeleteCountdown(0);
    showInfoToast("Hesap silme iptal edildi");
  };

  const performDelete = async () => {
    try {
      error(); // Hata titreşimi
      await deleteAccount();
      showInfoToast("Hesabınız kalıcı olarak silindi. Görüşmek üzere...");
    } catch {
      showInfoToast("Hesap silinemedi");
    } finally {
      setIsDeleting(false);
      setDeleteCountdown(0);
    }
  };

  const handleClearData = () => {
    heavy();
    Alert.alert(
      "Yerel Verileri Sil",
      `${history.length} ürün kaydı ve indirilen resimler silinecek. Bu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Temizle",
          style: "destructive",
          onPress: async () => {
            heavy();
            setIsClearing(true);
            try {
              await clearHistory();
              showInfoToast("Tüm veriler temizlendi");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  };

  const handleHapticToggle = (newValue: boolean) => {
    if (!newValue && hapticEnabled) {
      error();
    }
    setHapticEnabled(newValue);
    if (newValue) {
      success();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Başlık */}
        <Text className="text-3xl font-bold text-foreground mb-2">Ayarlar</Text>
        <Text className="text-muted-foreground text-base mb-6">
          Uygulama ayarlarınızı buradan yönetin
        </Text>

        {/* HESAP Bölümü */}
        <Text className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Hesap
        </Text>
        <View className="gap-2 mb-6">
          {/* Hesap Bilgisi */}
          <View className="bg-primary/5 border border-primary/30 rounded-2xl p-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
                <Ionicons name="person" size={24} color="#8B5CF6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-foreground font-semibold text-lg">
                  {user?.username || "Kullanıcı"}
                </Text>
                <Text className="text-muted-foreground text-base">
                  {user?.email || "E-posta bulunamadı"}
                </Text>
              </View>
            </View>
          </View>

          {/* Çıkış Yap */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-card border border-border rounded-2xl p-4 flex-row items-center"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 bg-destructive/10 rounded-full items-center justify-center">
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-destructive font-semibold text-lg">
                Çıkış Yap
              </Text>
              <Text className="text-muted-foreground text-base">
                Hesabınızdan çıkış yapın
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colorScheme === "dark" ? "#525252" : "#A3A3A3"}
            />
          </TouchableOpacity>

          {/* Çıkış bilgi notu */}
          <Text className="text-muted-foreground text-sm px-2 mt-1">
            Çıkış yaptığınızda tarama geçmişiniz bu cihazda korunur.
          </Text>
        </View>

        {/* AYARLAR Bölümü */}
        <Text className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Ayarlar
        </Text>
        <View className="gap-2 mb-6">
          {/* Tema Ayarı */}
          <View className="bg-card border border-border rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-yellow-500/10 rounded-full items-center justify-center">
                <Ionicons name="sunny-outline" size={24} color="#EAB308" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-foreground font-semibold text-lg">
                  Tema
                </Text>
                <Text className="text-muted-foreground text-base">
                  Görünüm tercihi
                </Text>
              </View>
            </View>
            <View className="flex-row bg-secondary/50 rounded-xl p-1">
              {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  disabled={isThemeChanging}
                  onPress={() => {
                    if (isThemeChanging || themeMode === mode) return;
                    selection();
                    setIsThemeChanging(true);
                    setThemeMode(mode);
                    setTimeout(() => setIsThemeChanging(false), 300);
                  }}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    themeMode === mode ? "bg-primary" : ""
                  } ${isThemeChanging ? "opacity-70" : ""}`}
                >
                  <Text
                    className={
                      themeMode === mode
                        ? "text-primary-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {mode === "system"
                      ? "Sistem"
                      : mode === "light"
                        ? "Açık"
                        : "Koyu"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Titreşim Ayarı */}
          <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center">
            <View className="w-12 h-12 bg-blue-500/10 rounded-full items-center justify-center">
              <Ionicons
                name="phone-portrait-outline"
                size={24}
                color="#3B82F6"
              />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-foreground font-semibold text-lg">
                Titreşim
              </Text>
              <Text className="text-muted-foreground text-base">
                Dokunmatik geri bildirim
              </Text>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={handleHapticToggle}
              trackColor={{ false: "#767577", true: "#8B5CF6" }}
              thumbColor={hapticEnabled ? "#FFFFFF" : "#F4F3F4"}
            />
          </View>
        </View>

        {/* GELİŞMİŞ AYARLAR Accordion */}
        <TouchableOpacity
          onPress={() => {
            selection();
            setShowAdvanced(!showAdvanced);
          }}
          className="flex-row items-center justify-between mt-3 mb-3"
          activeOpacity={0.7}
        >
          <Text className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
            Gelişmiş Ayarlar
          </Text>
          <Ionicons
            name={showAdvanced ? "chevron-up" : "chevron-down"}
            size={16}
            color={colorScheme === "dark" ? "#525252" : "#A3A3A3"}
          />
        </TouchableOpacity>

        {showAdvanced && (
          <View className="gap-2 mb-6">
            {/* Yerel Verileri Sil */}
            <TouchableOpacity
              onPress={handleClearData}
              disabled={isClearing || history.length === 0}
              className={`bg-card border border-border rounded-2xl p-4 flex-row items-center ${
                history.length === 0 ? "opacity-50" : ""
              }`}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-amber-500/10 rounded-full items-center justify-center">
                <Ionicons name="trash-outline" size={24} color="#F59E0B" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-amber-500 font-semibold text-lg">
                  Yerel Verileri Sil
                </Text>
                <Text className="text-muted-foreground text-base">
                  {history.length > 0
                    ? `${history.length} kayıt ve resimler silinecek`
                    : "Silinecek veri yok"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colorScheme === "dark" ? "#525252" : "#A3A3A3"}
              />
            </TouchableOpacity>

            {/* Hesabımı Sil */}
            {!isDeleting ? (
              <TouchableOpacity
                onPress={handleDeleteAccount}
                className="bg-destructive/5 border border-destructive/30 rounded-2xl p-4 flex-row items-center"
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 bg-destructive/20 rounded-full items-center justify-center">
                  <Ionicons name="skull-outline" size={24} color="#DC2626" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-red-600 font-semibold text-lg">
                    Hesabımı Sil
                  </Text>
                  <Text className="text-muted-foreground text-base">
                    Hesabınızı kalıcı olarak silin
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colorScheme === "dark" ? "#525252" : "#A3A3A3"}
                />
              </TouchableOpacity>
            ) : (
              // Geri Sayım Ekranı
              <View className="bg-destructive/20 border-2 border-destructive rounded-2xl p-4">
                <View className="items-center mb-4">
                  <Ionicons name="warning" size={48} color="#DC2626" />
                  <Text className="text-destructive font-bold text-xl mt-2">
                    Hesap Siliniyor...
                  </Text>
                  <Text className="text-destructive/80 text-center mt-1">
                    {deleteCountdown} saniye içinde hesabınız silinecek
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={cancelDelete}
                  className="bg-card border border-border rounded-xl py-3 items-center"
                >
                  <Text className="text-foreground font-semibold">
                    İptal Et
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Footer - Yasal Linkler ve Versiyon */}
        <View className="items-center py-6 mt-4 mb-2 border-t border-border">
          {/* Yasal Linkler */}
          <View className="flex-row items-center gap-2 mb-2">
            <TouchableOpacity
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  "https://besindenetle.furkanpasa.com/privacy",
                )
              }
              activeOpacity={0.7}
            >
              <Text className="text-primary text-base">
                Gizlilik Politikası
              </Text>
            </TouchableOpacity>
            <Text className="text-muted-foreground">•</Text>
            <TouchableOpacity
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  "https://besindenetle.furkanpasa.com/terms",
                )
              }
              activeOpacity={0.7}
            >
              <Text className="text-primary text-base">Kullanım Koşulları</Text>
            </TouchableOpacity>
          </View>

          {/* Versiyon ve Copyright */}
          <Text className="text-muted-foreground text-sm">
            Besin Denetle v{Constants.expoConfig?.version || "1.0.0"}
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">
            © {new Date().getFullYear()} Tüm hakları saklıdır
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
