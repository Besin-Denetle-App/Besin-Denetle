import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseApiError } from "../../services/api";
import { useAuthStore } from "../../stores/auth.store";

export default function RegisterScreen() {
  const { colorScheme } = useColorScheme();
  const { completeRegistration, isLoading, tempToken } = useAuthStore();
  const [username, setUsername] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // tempToken yoksa login'e yonlendir (race condition onleme)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!tempToken) {
        console.log("[Register] No tempToken found, redirecting to login");
        router.replace("/(auth)/login");
      } else {
        console.log("[Register] tempToken found, ready to register");
        setIsReady(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [tempToken]);

  // Henuz hazir degilse loading goster
  if (!isReady) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const isValid = username.trim().length >= 3 && termsAccepted;

  const handleRegister = async () => {
    if (!isValid || isLoading) return;

    try {
      setError(null);
      await completeRegistration(username.trim());
      router.replace("/(tabs)");
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {/* Geri Butonu */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mt-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colorScheme === "dark" ? "#E0E0E0" : "#212121"}
            />
          </TouchableOpacity>

          {/* Baslik */}
          <View className="mt-8 mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Hesabını Oluştur
            </Text>
            <Text className="text-muted-foreground text-base">
              Son bir adım kaldı! Bir kullanıcı adı seç.
            </Text>
          </View>

          {/* Hata Mesajı */}
          {error && (
            <View className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-6">
              <Text className="text-destructive text-center">{error}</Text>
            </View>
          )}

          {/* Username Input */}
          <View className="mb-6">
            <Text className="text-foreground font-medium mb-2">
              Kullanıcı Adı
            </Text>
            <TextInput
              value={username}
              onChangeText={(text) => {
                // Sadece izin verilen karakterleri kabul et
                const filtered = text.replace(/[^a-zA-Z0-9_]/g, "");
                setUsername(filtered.toLowerCase());
              }}
              placeholder="Örn: kullanici_adi"
              placeholderTextColor={
                colorScheme === "dark" ? "#757575" : "#A3A3A3"
              }
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              className={`bg-secondary/50 border-2 rounded-2xl px-4 py-4 text-foreground text-base ${
                username.length > 0 && username.length < 3
                  ? "border-destructive"
                  : "border-primary"
              }`}
            />
            <View className="flex-row justify-between mt-2">
              <Text
                className={`text-sm ${
                  username.length > 0 && username.length < 3
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {username.length > 0 && username.length < 3
                  ? "En az 3 karakter gerekli"
                  : "Harf, rakam ve alt çizgi kullanabilirsin"}
              </Text>
              <Text
                className={`text-sm ${
                  username.length >= 18
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
              >
                {username.length}/20
              </Text>
            </View>
          </View>

          {/* Terms Checkbox */}
          <View className="flex-row items-start mb-8">
            <TouchableOpacity
              onPress={() => setTermsAccepted(!termsAccepted)}
              className="flex-row items-start"
              activeOpacity={0.7}
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 mt-0.5 ${
                  termsAccepted ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {termsAccepted && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
            <Text className="text-foreground flex-1 text-sm leading-5">
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
              {`'nı okudum ve kabul ediyorum.`}
            </Text>
          </View>

          {/* Kayıt Butonu */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={!isValid || isLoading}
            className={`rounded-2xl py-4 items-center ${
              isValid ? "bg-primary" : "bg-muted"
            }`}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className={`font-bold text-base ${
                  isValid ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Hesabı Oluştur
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
