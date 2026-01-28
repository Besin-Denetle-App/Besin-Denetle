import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
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
import { showErrorToast } from "../../components/feedback";
import { useDebouncedNavigation } from "../../hooks/use-debounce";
import { parseApiError } from "../../services/api";
import { useAuthStore } from "../../stores/auth.store";

export default function EmailSignupScreen() {
  const { colorScheme } = useColorScheme();
  const { signupWithEmail, isLoading } = useAuthStore();
  const { navigate } = useDebouncedNavigation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Gmail domain kontrolu
  const isGmail = email.toLowerCase().trim().endsWith("@gmail.com");

  // Form validasyonu - sadece Gmail kabul ediliyor
  const isValid = email.trim().length >= 5 && email.includes("@") && isGmail;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    console.log("[EmailSignup] Submitting:", { email });

    try {
      setError(null);
      const result = await signupWithEmail(email.trim().toLowerCase());

      console.log("[EmailSignup] Result:", result);

      if (result.needsRegistration) {
        // Yeni kullanici - username belirleme ekranina yonlendir
        console.log("[EmailSignup] Navigating to register screen");
        navigate("/(auth)/register");
      } else {
        // Mevcut kullanici - ana ekrana yonlendir
        console.log("[EmailSignup] Navigating to tabs (existing user)");
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("[EmailSignup] Error:", err);
      const errorMsg = parseApiError(err);
      setError(errorMsg);
      showErrorToast(errorMsg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
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
              E-posta ile Giriş
            </Text>
            <Text className="text-muted-foreground text-base">
              Beta test için Gmail adresinizi giriniz
            </Text>
          </View>

          {/* Hata Mesajı */}
          {error && (
            <View className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-6">
              <Text className="text-destructive text-center">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-4">
            {/* E-posta Input */}
            <View>
              <Text className="text-foreground font-medium mb-2">
                Gmail Adresi
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@gmail.com"
                placeholderTextColor={
                  colorScheme === "dark" ? "#757575" : "#A3A3A3"
                }
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="bg-secondary/50 border-2 border-primary rounded-2xl px-4 py-4 text-foreground text-base"
              />
              {/* Gmail uyarısı */}
              {email.length > 0 && email.includes("@") && !isGmail && (
                <Text className="text-amber-500 text-sm mt-2">
                  ⚠️ Sadece Gmail adresleri kabul edilmektedir
                </Text>
              )}
            </View>
          </View>

          {/* Devam Butonu */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            className={`rounded-2xl py-4 items-center mt-8 ${isValid ? "bg-primary" : "bg-muted"
              }`}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className={`font-bold text-base ${isValid ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
              >
                Devam Et
              </Text>
            )}
          </TouchableOpacity>

          {/* Bilgi Notu */}
          <Text className="text-muted-foreground text-center text-sm mt-6 px-4">
            Bu Gmail adresi daha önce kayıtlıysa doğrudan giriş yapılacaktır.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
