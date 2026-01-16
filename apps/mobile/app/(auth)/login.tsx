import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebouncedNavigation } from '../../hooks/use-debounce';
import { parseApiError } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

// Expo Go'da ve standalone'da auth session'ı tamamlamak için gerekli
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const { loginWithGoogle, isLoading } = useAuthStore();
  const { navigate } = useDebouncedNavigation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false); // Sonsuz döngü önleme için

  const googleConfig = Constants.expoConfig?.extra?.google || {};
  
  // Expo Go mu yoksa native build mi?
  const isExpoGo = Constants.appOwnership === 'expo';
  
  // Redirect URI: Expo Go için proxy, native build için scheme
  const redirectUri = isExpoGo
    ? 'https://auth.expo.io/@furkanpasa/Besin-Denetle'
    : makeRedirectUri({ scheme: 'besindenetle', path: 'auth' });

  // Google OAuth request
  // Expo Go'da sadece webClientId kullanılır, native build'de platform'a göre seçilir
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleConfig.webClientId,
    androidClientId: isExpoGo ? undefined : googleConfig.androidClientId,
    iosClientId: isExpoGo ? undefined : googleConfig.iosClientId,
    redirectUri,
    scopes: ['openid', 'email', 'profile'],
  });

  // Google OAuth response'ını useEffect ile yakala
  useEffect(() => {
    // Response değiştiğinde logla (debug için)
    if (response?.type === 'error') {
      console.error('Google OAuth Error:', response.error);
    }

    async function handleGoogleResponse() {
      if (response?.type === 'success') {
        const { authentication } = response;
        // Backend Google verifyIdToken API'si idToken bekliyor, accessToken değil
        if (authentication?.idToken && !isProcessingRef.current) {
          isProcessingRef.current = true;
          setIsProcessing(true);
          setError(null);
          try {
            const loginResult = await loginWithGoogle(authentication.idToken);
            
            if (loginResult.needsRegistration) {
              navigate('/(auth)/register');
            } else {
              router.replace('/(tabs)');
            }
          } catch (err) {
            setError(parseApiError(err));
          } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
          }
        }
      } else if (response?.type === 'error') {
        console.error('Google auth error:', response.error);
        setError('Google girişi sırasında bir hata oluştu');
      } else if (response?.type === 'dismiss') {
        console.log('Google auth dismissed by user');
      }
    }

    handleGoogleResponse();
  }, [response, loginWithGoogle, navigate]);

  // Google giriş butonuna tıklandığında
  const handleGoogleLogin = async () => {
    try {
      setError(null);
      // showInRecents: true - Android'de callback'in düzgün çalışmasını sağlar
      const result = await promptAsync({ showInRecents: true });
      
      if (result?.type === 'success') {
        const { authentication } = result;        
        if (authentication?.idToken) {
          setIsProcessing(true);
          try {
            const loginResult = await loginWithGoogle(authentication.idToken);
            
            if (loginResult.needsRegistration) {
              navigate('/(auth)/register');
            } else {
              router.replace('/(tabs)');
            }
          } catch (err) {
            console.error('Backend login error:', err);
            setError(parseApiError(err));
          } finally {
            setIsProcessing(false);
          }
        } else {
          console.error('idToken missing in response');
          setError('Google girişi başarısız: idToken alınamadı');
        }
      } else if (result?.type === 'error') {
        console.error('Google auth error:', result.error);
        setError('Google girişi sırasında bir hata oluştu: ' + (result.error?.message || 'Bilinmeyen hata'));
      } else if (result?.type === 'dismiss' || result?.type === 'cancel') {
        console.log('Google auth dismissed/cancelled by user');
      }
    } catch (err) {
      console.error('promptAsync error:', err);
      setError(parseApiError(err));
    }
  };

  // E-posta butonuna tıklandığında (debounced - çift tıklama engellenir)
  const handleEmailNavigation = () => {
    if (isLoading || isProcessing) return;
    navigate('/(auth)/email-signup');
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
            disabled={isLoading || isProcessing || !request}
            className="bg-card border border-border rounded-2xl py-4 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            {(isLoading || isProcessing) ? (
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

          {/* E-posta ile Giriş (Beta) */}
          <TouchableOpacity
            onPress={handleEmailNavigation}
            disabled={isLoading || isProcessing}
            className="bg-card border border-border rounded-2xl py-4 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons
              name="mail-outline"
              size={24}
              color={colorScheme === 'dark' ? '#E0E0E0' : '#212121'}
            />
            <Text className="text-foreground font-semibold text-base ml-3">
              E-posta ile Giriş
            </Text>
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
          {`'nı kabul etmiş olursunuz.`}
        </Text>
      </View>
    </SafeAreaView>
  );
}
