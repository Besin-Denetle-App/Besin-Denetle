import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseApiError } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

export default function RegisterScreen() {
  const { colorScheme } = useColorScheme();
  const { completeRegistration, isLoading, tempToken } = useAuthStore();
  const [username, setUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // tempToken kontrolünü useEffect içinde yap (race condition önleme)
  useEffect(() => {
    // Kısa bir gecikme ile tempToken'ın set edilmesini bekle
    const timer = setTimeout(() => {
      if (!tempToken) {
        console.log('[Register] No tempToken found, redirecting to login');
        router.replace('/(auth)/login');
      } else {
        console.log('[Register] tempToken found, ready to register');
        setIsReady(true);
      }
    }, 100); // 100ms bekle

    return () => clearTimeout(timer);
  }, [tempToken]);

  // Henüz hazır değilse loading göster
  if (!isReady) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  const isValid = username.trim().length >= 3 && termsAccepted;

  const handleRegister = async () => {
    if (!isValid) return;

    try {
      setError(null);
      await completeRegistration(username.trim());
      router.replace('/(tabs)');
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              color={colorScheme === 'dark' ? '#E0E0E0' : '#212121'}
            />
          </TouchableOpacity>

          {/* Başlık */}
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
              onChangeText={setUsername}
              placeholder="Örn: ahmet_yilmaz"
              placeholderTextColor={colorScheme === 'dark' ? '#757575' : '#A3A3A3'}
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-secondary/50 border border-border rounded-2xl px-4 py-4 text-foreground text-base"
            />
            <Text className="text-muted-foreground text-sm mt-2">
              En az 3 karakter olmalı. Harf, rakam ve alt çizgi kullanabilirsin.
            </Text>
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
                  termsAccepted
                    ? 'bg-primary border-primary'
                    : 'border-border'
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
                onPress={() => router.push('/(auth)/terms' as any)}
              >
                Kullanım Koşulları
              </Text>
              {' '}ve{' '}
              <Text
                className="text-primary underline"
                onPress={() => router.push('/(auth)/privacy' as any)}
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
              isValid ? 'bg-primary' : 'bg-muted'
            }`}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className={`font-bold text-base ${
                  isValid ? 'text-primary-foreground' : 'text-muted-foreground'
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
