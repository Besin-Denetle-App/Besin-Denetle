import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDebouncedNavigation } from "../../hooks/use-debounce";
import { parseApiError } from "../../services/api";
import { useAuthStore } from "../../stores/auth.store";

// Auth session callback icin gerekli
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { loginWithGoogle, isLoading } = useAuthStore();
  const { navigate } = useDebouncedNavigation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  const googleConfig = Constants.expoConfig?.extra?.google || {};

  // Expo Go veya native build kontrolu
  const isExpoGo = Constants.appOwnership === "expo";

  // Redirect URI: Expo Go için proxy, native build için scheme
  const redirectUri = isExpoGo
    ? "https://auth.expo.io/@furkanpasa/Besin-Denetle"
    : makeRedirectUri({ scheme: "besindenetle", path: "auth" });

  // Google OAuth request konfigurasyonu
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleConfig.webClientId,
    androidClientId: isExpoGo ? undefined : googleConfig.androidClientId,
    iosClientId: isExpoGo ? undefined : googleConfig.iosClientId,
    redirectUri,
    scopes: ["openid", "email", "profile"],
  });

  // Google OAuth response handler
  useEffect(() => {
    if (response?.type === "error") {
      console.error("Google OAuth Error:", response.error);
    }

    async function handleGoogleResponse() {
      if (response?.type === "success") {
        const { authentication } = response;
        // Backend idToken bekliyor
        if (authentication?.idToken && !isProcessingRef.current) {
          isProcessingRef.current = true;
          setIsProcessing(true);
          setError(null);
          try {
            const loginResult = await loginWithGoogle(authentication.idToken);

            if (loginResult.needsRegistration) {
              navigate("/(auth)/register");
            } else {
              router.replace("/(tabs)");
            }
          } catch (err) {
            setError(parseApiError(err));
          } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
          }
        }
      } else if (response?.type === "error") {
        console.error("Google auth error:", response.error);
        setError("Google girişi sırasında bir hata oluştu");
      } else if (response?.type === "dismiss") {
        console.log("Google auth dismissed by user");
      }
    }

    handleGoogleResponse();
  }, [response, loginWithGoogle, navigate]);

  // Google giris butonu handler
  const handleGoogleLogin = async () => {
    try {
      setError(null);
      // showInRecents: Android callback icin gerekli
      const result = await promptAsync({ showInRecents: true });

      if (result?.type === "success") {
        const { authentication } = result;
        if (authentication?.idToken) {
          setIsProcessing(true);
          try {
            const loginResult = await loginWithGoogle(authentication.idToken);

            if (loginResult.needsRegistration) {
              navigate("/(auth)/register");
            } else {
              router.replace("/(tabs)");
            }
          } catch (err) {
            console.error("Backend login error:", err);
            setError(parseApiError(err));
          } finally {
            setIsProcessing(false);
          }
        } else {
          console.error("idToken missing in response");
          setError("Google girişi başarısız: idToken alınamadı");
        }
      } else if (result?.type === "error") {
        console.error("Google auth error:", result.error);
        setError(
          "Google girişi sırasında bir hata oluştu: " +
          (result.error?.message || "Bilinmeyen hata"),
        );
      } else if (result?.type === "dismiss" || result?.type === "cancel") {
        console.log("Google auth dismissed/cancelled by user");
      }
    } catch (err) {
      console.error("promptAsync error:", err);
      setError(parseApiError(err));
    }
  };

  // E-posta butonuna tıklandığında (çift tıklama engellenir)
  const handleEmailNavigation = () => {
    if (isLoading || isProcessing) return;
    navigate("/(auth)/email-signup");
  };

  // @disabled Apple Sign In
  // Gerekli: expo-apple-authentication paketi + loginWithApple store fonksiyonu
  /*
  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        setError(null);
        const loginResult = await loginWithApple(credential.identityToken);
        
        if (loginResult.needsRegistration) {
          navigate('/(auth)/register');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      if (err.code === 'ERR_CANCELED') {
        // Kullanıcı iptal etti
        return;
      }
      setError(parseApiError(err));
    }
  };
  */

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        {/* Logo ve Başlık */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
            <Ionicons name="nutrition" size={48} color={COLORS.primary} />
          </View>
          <Text className="text-3xl font-bold text-foreground mb-2">
            Besin Denetle
          </Text>
          <Text className="text-muted-foreground text-center text-base">
            Daha sağlıklı seçimler için{"\n"}ürünlerin içeriğini keşfedin
          </Text>
        </View>

        {/* Hata Mesajı */}
        {error && (
          <View className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-6">
            <Text className="text-destructive text-center">{error}</Text>
          </View>
        )}

        {/* OAuth Butonları */}
        <View className="gap-4">
          {/* Google ile Giriş - Tema uyumlu + Google mavisi vurgu */}
          <TouchableOpacity
            onPress={() => handleGoogleLogin()}
            disabled={isLoading || isProcessing || !request}
            style={{ borderColor: "#4285F4" }}
            className="bg-card border-2 rounded-3xl py-4 flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            {isLoading || isProcessing ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
                <Text className="text-foreground font-semibold text-base ml-3">
                  Google ile Giriş Yap
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple ile Giriş - Koyu gri premium görünüm */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Apple ile Giriş",
                "Apple ile giriş şimdilik kullanılamamaktadır. Lütfen Google veya E-posta ile giriş yapın.",
                [{ text: "Tamam", style: "default" }],
              );
            }}
            disabled={isLoading || isProcessing}
            style={{ backgroundColor: "#18181b" }}
            className="rounded-3xl py-4 flex-row items-center justify-center border-2 border-gray-600"
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base ml-3">
              Apple ile Giriş Yap
            </Text>
            <View
              style={{ backgroundColor: "#3f3f46" }}
              className="rounded-full px-2 py-0.5 ml-2"
            >
              <Text className="text-gray-300 text-xs font-medium">Yakında</Text>
            </View>
          </TouchableOpacity>

          {/* E-posta ile Giriş - Mor */}
          <TouchableOpacity
            onPress={handleEmailNavigation}
            disabled={isLoading || isProcessing}
            className="bg-primary border-2 border-primary rounded-3xl py-4 flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={24} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base ml-3">
              E-posta ile Giriş
            </Text>
            <View className="bg-white/20 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-xs font-medium">Beta</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Alt Açıklama */}
        <Text className="text-muted-foreground text-center text-sm mt-8 px-4">
          Giriş yaparak{" "}
          <Text
            className="text-primary underline"
            onPress={() => router.push("/(auth)/terms" as any)}
          >
            Kullanım Koşulları
          </Text>{" "}
          ve{" "}
          <Text
            className="text-primary underline"
            onPress={() => router.push("/(auth)/privacy" as any)}
          >
            Gizlilik Politikası
          </Text>
          {`'nı kabul etmiş olursunuz.`}
        </Text>
      </View>
    </SafeAreaView>
  );
}
