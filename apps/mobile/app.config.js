// .env dosyasını sadece EAS build harici yükle
// EAS build sırasında APP_ENV zaten eas.json'dan gelir
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (!process.env.APP_ENV || process.env.APP_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

//  Environment Config
//
// ┌─────────────────┬─────────────────┬────────────────────────────┐
// │ Senaryo         │ Env Kaynağı     │ API Değişkenleri           │
// ├─────────────────┼─────────────────┼────────────────────────────┤
// │ expo start      │ .env dosyası    │ DEV_API_HOST:DEV_API_PORT  │
// │ local preview   │ eas.json        │ API_URL                    │
// │ local prod      │ eas.json        │ API_URL                    │
// │ cloud preview   │ eas.json        │ API_URL                    │
// │ cloud prod      │ EAS Secrets     │ API_URL                    │
// └─────────────────┴─────────────────┴────────────────────────────┘
//
// ============================================================

/**
 * Build profile
 */
const APP_ENV = process.env.APP_ENV || "development";

/**
 * API config
 */
const getApiConfig = () => {
  switch (APP_ENV) {
    case "production":
      return {
        apiUrl: process.env.API_URL || null,
        apiHost: null,
        apiPort: null,
      };

    case "preview":
      return {
        apiUrl: process.env.API_URL || null,
        apiHost: null,
        apiPort: null,
      };

    case "development":
    default:
      return {
        apiUrl: null,
        apiHost: process.env.DEV_API_HOST || null,
        apiPort: process.env.DEV_API_PORT || "50101",
      };
  }
};

/**
 * Google OAuth
 */
const getGoogleConfig = () => ({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID || null,
  androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || null,
  iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || null,
});

// Debug log - app.config.js ilk yüklendiğinde gösterilir
if (!global.__BUILD_CONFIG_LOGGED__) {
  global.__BUILD_CONFIG_LOGGED__ = true;
  console.log("=== BUILD CONFIG (Initial Load) ===");
  console.log("APP_ENV:", APP_ENV);
  console.log("API Config:", getApiConfig());

  // EAS build sırasında bu değerler local validation içindir
  // Asıl build, builderEnvironment'tan gelen değerlerle yapılır
  if (APP_ENV === "development" && process.env.EAS_BUILD === "true") {
    console.log("");
    console.log("   EAS Build Detected:");
    console.log("   Yukarıdaki değerler local validation içindir.");
    console.log("   Asıl build, eas.json'daki env değerleriyle yapılacak.");
  }
  console.log("====================================");
}

// Expo Config

module.exports = {
  expo: {
    // Uygulama
    name: "Besin Denetle",
    slug: "Besin-Denetle",
    scheme: "besindenetle",
    version: "0.25.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    // Görseller
    icon: "./assets/images/icon.png",

    // iOS
    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.besindenetle.ios",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription:
          "Barkod taraması için kamera erişimi gereklidir.",
      },
    },

    // Android
    android: {
      package: "app.besindenetle.android",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#1E1929",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    // Web
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    // Plugins
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#fafafa",
          image: "./assets/images/splash-icon.png",
          dark: {
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#121212",
          },
          imageWidth: 200,
          resizeMode: "contain",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],

    // Experiments
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    // Runtime vars
    extra: {
      appEnv: APP_ENV,
      ...getApiConfig(),
      google: getGoogleConfig(),
      eas: {
        projectId: "ac7692e7-1d00-4db1-907b-548024e0272d",
      },
    },
  },
};
