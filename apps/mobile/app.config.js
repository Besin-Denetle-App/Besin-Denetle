// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

// ============================================================
// Environment Konfigürasyonu
// ============================================================

/**
 * Build profile (eas.json'dan geliyor)
 * - development: expo start
 * - preview: eas build --profile preview
 * - production: eas build --profile production
 */
const APP_ENV = process.env.APP_ENV || 'development';

/**
 * API konfigürasyonu - Build profile'a göre seçilir
 */
const getApiConfig = () => {
  switch (APP_ENV) {
    case 'production':
      // Production: Tam URL kullan (https://api.besindenetle.app/api)
      return {
        apiUrl: process.env.API_URL || null,
        apiHost: null,
        apiPort: null,
      };

    case 'preview':
      // Preview: Host + Port kullan (test sunucusu)
      return {
        apiUrl: null,
        apiHost: process.env.API_HOST || null,
        apiPort: process.env.API_PORT || '3200',
      };

    case 'development':
    default:
      // Development: DEV_API_HOST + DEV_API_PORT kullan (local)
      return {
        apiUrl: null,
        apiHost: process.env.DEV_API_HOST || null,
        apiPort: process.env.DEV_API_PORT || '3200',
      };
  }
};

/**
 * Google OAuth konfigürasyonu
 */
const getGoogleConfig = () => ({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID || null,
  androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || null,
  iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || null,
});

// Debug log (sadece development'ta)
if (APP_ENV === 'development') {
  console.log(`[Config] APP_ENV: ${APP_ENV}`);
  console.log(`[Config] API:`, getApiConfig());
}

// ============================================================
// Expo Konfigürasyonu
// ============================================================

module.exports = {
  expo: {
    // Uygulama Bilgileri
    name: 'Besin Denetle',
    slug: 'Besin-Denetle',
    scheme: 'besindenetle',
    version: '0.7.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    // Görsel Öğeler
    icon: './assets/images/icon.png',

    // iOS Ayarları
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.besindenetle.ios',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'Barkod taraması için kamera erişimi gereklidir.',
      },
    },

    // Android Ayarları
    android: {
      package: 'app.besindenetle.android',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#1E1929',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    // Web Ayarları
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    // Eklentiler
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#fafafa',
          image: './assets/images/splash-icon.png',
          dark: {
            image: './assets/images/splash-icon-dark.png',
            backgroundColor: '#121212',
          },
          imageWidth: 200,
          resizeMode: 'contain',
        },
      ],
    ],

    // Deneysel Özellikler
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    // Runtime Değişkenleri (uygulama içinden erişilebilir)
    extra: {
      appEnv: APP_ENV,
      ...getApiConfig(),
      google: getGoogleConfig(),
      eas: {
        projectId: 'ac7692e7-1d00-4db1-907b-548024e0272d',
      },
    },
  },
};
