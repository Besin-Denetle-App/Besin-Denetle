import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, LogBox, Platform, Text, View } from "react-native";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "nativewind";
import { ErrorBoundary, ToastContainer } from "../components/feedback";
import { COLORS } from "../constants";
import { useNetwork } from "../hooks/use-network";
import { useAuthStore } from "../stores/auth.store";
import { useHapticsStore } from "../stores/haptics.store";
import { useThemeStore } from "../stores/theme.store";

// SafeAreaView uyarılarını gizle
LogBox.ignoreLogs(["SafeAreaView"]);

export const unstable_settings = {
  anchor: "(tabs)",
};

// Internet baglantisi durumunu gosteren banner
function NetworkBanner() {
  const { showOfflineBanner, showOnlineBanner } = useNetwork();

  if (showOfflineBanner) {
    return (
      <View className="absolute top-12 left-4 right-4 bg-destructive/90 px-4 py-3 rounded-xl flex-row items-center justify-center z-50">
        <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
        <Text className="text-white font-medium ml-2">
          İnternet bağlantısı yok
        </Text>
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

  // Store'lari baslat (auth, haptics, theme)
  useEffect(() => {
    initialize();
    initializeHaptics();
    initializeTheme();
  }, [initialize, initializeHaptics, initializeTheme]);

  // Tema moduna gore colorScheme guncelle
  useEffect(() => {
    if (themeMode === "system") {
      setColorScheme("system");
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode, setColorScheme]);

  // Android navigation bar renklerini tema ile senkronize et
  useEffect(() => {
    if (Platform.OS === "android") {
      const systemColors =
        colorScheme === "dark" ? COLORS.systemUI.dark : COLORS.systemUI.light;
      NavigationBar.setBackgroundColorAsync(systemColors.background);
      NavigationBar.setButtonStyleAsync(
        systemColors.foreground as "light" | "dark",
      );
    }
  }, [colorScheme]);

  // Auth durumuna gore yonlendirme (protected routes)
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Giris yapilmamis -> login sayfasina yonlendir
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Giris yapilmis -> ana sayfaya yonlendir
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Auth yukleniyor - loading ekrani
  if (isLoading) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View
          className={`flex-1 bg-background items-center justify-center ${colorScheme}`}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View className={`flex-1 ${colorScheme}`}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product" options={{ headerShown: false }} />
          </Stack>
          <NetworkBanner />
          <ToastContainer />
          <StatusBar
            style={
              colorScheme === "dark"
                ? COLORS.systemUI.dark.foreground
                : COLORS.systemUI.light.foreground
            }
            backgroundColor={
              colorScheme === "dark"
                ? COLORS.systemUI.dark.background
                : COLORS.systemUI.light.background
            }
          />
        </View>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
