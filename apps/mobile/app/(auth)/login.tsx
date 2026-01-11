import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseApiError } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const { loginWithGoogle, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const googleConfig = Constants.expoConfig?.extra?.google || {};

  /* 
    expo-auth-session: Expo Go'da (proxy modunda) çalışması için
    sadece webClientId kullanılmalı ve native ID'ler verilmemelidir.
    Native ID verilince kütüphane native redirect (scheme:/...) yapmaya çalışır.
  */
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleConfig.webClientId,
    // androidClientId: googleConfig.androidClientId, // Expo Go için kapatıldı
    // iosClientId: googleConfig.iosClientId, // Expo Go için kapatıldı
    redirectUri: 'https://auth.expo.io/@furkanpasa/Besin-Denetle',
  });

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { authentication } = result;
        if (authentication?.accessToken) {
          setError(null);
          const loginResult = await loginWithGoogle(authentication.accessToken);
          
          if (loginResult.needsRegistration) {
            router.push('/(auth)/register');
          } else {
            router.replace('/(tabs)');
          }
        }
      } else if (result?.type === 'error') {
        setError('Google girişi sırasında bir hata oluştu');
      }
    } catch (err) {
      setError(parseApiError(err));
    }
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
          router.push('/(auth)/register');
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
            <Ionicons
              name="nutrition"
              size={48}
              color={colorScheme === 'dark' ? '#8B5CF6' : '#8B5CF6'}
            />
          </View>
          <Text className="text-3xl font-bold text-foreground mb-2">
            Besin Denetle
          </Text>
          <Text className="text-muted-foreground text-center text-base">
            Daha sağlıklı seçimler için{'\n'}ürünlerin içeriğini keşfedin
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
          {/* Google ile Giriş */}
          <TouchableOpacity
            onPress={() => handleGoogleLogin()}
            disabled={isLoading || !request}
            className="bg-card border border-border rounded-2xl py-4 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color={colorScheme === 'dark' ? '#E0E0E0' : '#212121'} />
            ) : (
              <>
                <Ionicons
                  name="logo-google"
                  size={24}
                  color={colorScheme === 'dark' ? '#E0E0E0' : '#212121'}
                />
                <Text className="text-foreground font-semibold text-base ml-3">
                  Google ile Giriş Yap
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* @disabled Apple Sign In */}
          {/* 
          <TouchableOpacity
            onPress={() => handleAppleLogin()}
            disabled={isLoading}
            className="bg-card border border-border rounded-2xl py-4 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons
              name="logo-apple"
              size={24}
              color={colorScheme === 'dark' ? '#E0E0E0' : '#212121'}
            />
            <Text className="text-foreground font-semibold text-base ml-3">
              Apple ile Giriş Yap
            </Text>
          </TouchableOpacity>
          */}
        </View>

        {/* Alt Açıklama */}
        <Text className="text-muted-foreground text-center text-sm mt-8 px-4">
          Giriş yaparak{' '}
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
          'nı kabul etmiş olursunuz.
        </Text>
      </View>
    </SafeAreaView>
  );
}
