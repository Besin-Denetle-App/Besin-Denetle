// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

module.exports = {
  expo: {
    name: 'Besin Denetle',
    slug: 'Besin-Denetle',
    scheme: 'besindenetle',
    version: '2.0.1',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.besindenetle.ios',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'Barkod taraması için kamera erişimi gereklidir.',
      },
    },
    android: {
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#1E1929',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'app.besindenetle.android',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        { // Uygulama açılış ekranı logosu
          backgroundColor: '#fafafa',
          image: './assets/images/splash-icon.png',
          dark: {
            image: './assets/images/splash-icon-dark.png',
            backgroundColor: '#121212'
          },
          imageWidth: 200,
          resizeMode: 'contain',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      // Environment variables (from .env)
      apiPort: process.env.API_PORT || '3200',
      apiUrl: process.env.API_URL || null,
      eas: {
        projectId: 'ac7692e7-1d00-4db1-907b-548024e0272d',
      },
      google: {
        iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      },
    },
  },
};
