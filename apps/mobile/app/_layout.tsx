import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from 'nativewind';
import { ActivityIndicator, LogBox, Text, View } from 'react-native';
import { ErrorBoundary, ToastContainer } from '../components/feedback';
import { useNetwork } from '../hooks/use-network';
import { useAuthStore } from '../stores/auth.store';
import { useHapticsStore } from '../stores/haptics.store';
import { useThemeStore } from '../stores/theme.store';

// Gereksiz uyarıları gizle
LogBox.ignoreLogs([
  'SafeAreaView',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

// Network Banner Komponenti
function NetworkBanner() {
  const { showOfflineBanner, showOnlineBanner } = useNetwork();

  if (showOfflineBanner) {
    return (
      <View className="absolute top-12 left-4 right-4 bg-destructive/90 px-4 py-3 rounded-xl flex-row items-center justify-center z-50">
        <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
        <Text className="text-white font-medium ml-2">İnternet bağlantısı yok</Text>
      </View>
    );
  }

  if (showOnlineBanner) {
    return (
      <View className="absolute top-12 left-4 right-4 bg-green-600/90 px-4 py-3 rounded-xl flex-row items-center justify-center z-50">
        <Ionicons name="cloud-done-outline" size={20} color="#FFFFFF" />
        <Text className="text-white font-medium ml-2">Bağlantı sağlandı</Text>
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { initialize: initializeHaptics } = useHapticsStore();
  const { mode: themeMode, initialize: initializeTheme } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();

  // Uygulama başlangıcında store'ları initialize et
  useEffect(() => {
    initialize();
    initializeHaptics();
    initializeTheme();
  }, [initialize, initializeHaptics, initializeTheme]);

  // Tema moduna göre colorScheme ayarla
  useEffect(() => {
    if (themeMode === 'system') {
      setColorScheme('system'); // Cihaz varsayılanını kullan
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode, setColorScheme]);

  // Auth durumuna göre yönlendirme
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Giriş yapılmamış ve auth grubunda değil -> login'e yönlendir
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Giriş yapılmış ve auth grubunda -> tabs'a yönlendir
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Loading durumunda splash göster
  if (isLoading) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View className={`flex-1 bg-background items-center justify-center ${colorScheme}`}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View className={`flex-1 ${colorScheme}`}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product" options={{ headerShown: false }} />
          </Stack>
          <NetworkBanner />
          <ToastContainer />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colorScheme === 'dark' ? '#0a0a0a' : '#ffffff'} />
        </View>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
