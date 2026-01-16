import { showInfoToast } from '@/components/feedback';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Alert, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth.store';
import { useHapticsStore } from '../../stores/haptics.store';
import { useHistoryStore } from '../../stores/history.store';
import { useThemeStore, type ThemeMode } from '../../stores/theme.store';

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const { user, logout } = useAuthStore();
  const { clearHistory, history } = useHistoryStore();
  const { enabled: hapticEnabled, setEnabled: setHapticEnabled, selection, light, medium, heavy, success, error } = useHapticsStore();
  const [isClearing, setIsClearing] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();

  const handleLogout = () => {
    heavy(); // Modal açılırken titreşim
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => {
            heavy(); // Sert titreşim - kritik aksiyon
            logout();
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    heavy(); // Modal açılırken titreşim
    Alert.alert(
      'Verileri Temizle',
      `${history.length} ürün kaydı ve indirilen resimler silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            heavy(); // Sert titreşim - kritik aksiyon
            setIsClearing(true);
            try {
              await clearHistory();
              showInfoToast('Tüm veriler temizlendi');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleHapticToggle = (newValue: boolean) => {
    // Kapatılırken ÖNCE error() tetikle (henüz açıkken)
    if (!newValue && hapticEnabled) {
      error();
    }
    
    setHapticEnabled(newValue);
    
    // Açılırken success
    if (newValue) {
      success();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-6 pt-4">
        {/* Başlık */}
        <Text className="text-3xl font-bold text-foreground mb-2">Ayarlar</Text>
        <Text className="text-muted-foreground text-base mb-6">
          Uygulama ayarlarınızı buradan yönetin
        </Text>

        {/* HESAP Bölümü */}
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Hesap
        </Text>
        <View className="gap-2 mb-2">
          {/* Hesap Bilgisi */}
          <View className="bg-primary/5 border border-primary/30 rounded-2xl p-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
                <Ionicons
                  name="person"
                  size={24}
                  color="#8B5CF6"
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-foreground font-semibold text-lg">
                  {user?.username || 'Kullanıcı'}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {user?.email || 'E-posta bulunamadı'}
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
              <Ionicons
                name="log-out-outline"
                size={24}
                color="#EF4444"
              />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-destructive font-semibold text-lg">
                Çıkış Yap
              </Text>
              <Text className="text-muted-foreground text-sm">
                Hesabınızdan çıkış yapın
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colorScheme === 'dark' ? '#525252' : '#A3A3A3'}
            />
          </TouchableOpacity>
        </View>

        {/* Çıkış bilgi notu */}
        <Text className="text-muted-foreground text-xs px-2 mb-6">
          Çıkış yaptığınızda tarama geçmişiniz bu cihazda korunur.
        </Text>

        {/* AYARLAR Bölümü */}
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Ayarlar
        </Text>
        <View className="gap-2">
          {/* Tema Ayarı - Segment Control */}
          <View className="bg-card border border-border rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-yellow-500/10 rounded-full items-center justify-center">
                <Ionicons
                  name="sunny-outline"
                  size={24}
                  color="#EAB308"
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-foreground font-semibold text-lg">
                  Tema
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Görünüm tercihi
                </Text>
              </View>
            </View>
            <View className="flex-row bg-secondary/50 rounded-xl p-1">
              {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
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
                  className={`flex-1 py-2 rounded-lg ${themeMode === mode ? 'bg-primary' : ''} ${isThemeChanging ? 'opacity-70' : ''}`}
                >
                  <Text className={`text-center font-medium ${themeMode === mode ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {mode === 'system' ? 'Sistem' : mode === 'light' ? 'Açık' : 'Koyu'}
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
              <Text className="text-muted-foreground text-sm">
                Dokunmatik geri bildirim
              </Text>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={handleHapticToggle}
              trackColor={{ false: '#767577', true: '#8B5CF6' }}
              thumbColor={hapticEnabled ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>

          {/* Verileri Temizle */}
          <TouchableOpacity
            onPress={handleClearData}
            disabled={isClearing || history.length === 0}
            className={`bg-card border border-border rounded-2xl p-4 flex-row items-center ${
              history.length === 0 ? 'opacity-50' : ''
            }`}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 bg-amber-500/10 rounded-full items-center justify-center">
              <Ionicons
                name="trash-outline"
                size={24}
                color="#F59E0B"
              />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-amber-500 font-semibold text-lg">
                Verileri Temizle
              </Text>
              <Text className="text-muted-foreground text-sm">
                {history.length > 0
                  ? `${history.length} kayıt ve resimler silinecek`
                  : 'Silinecek veri yok'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colorScheme === 'dark' ? '#525252' : '#A3A3A3'}
            />
          </TouchableOpacity>
        </View>

        {/* GEÇİCİ - Haptic Demo */}
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">
          Demo (Geçici)
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            onPress={() => selection()}
            className="bg-gray-500 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">🔹 Selection</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => light()}
            className="bg-blue-400 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">🔸 Light</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => medium()}
            className="bg-blue-500 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">🔸🔸 Medium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => heavy()}
            className="bg-blue-600 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">🔸🔸🔸 Heavy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => success()}
            className="bg-green-500 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">✅ Success</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => error()}
            className="bg-red-500 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">❌ Error</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
