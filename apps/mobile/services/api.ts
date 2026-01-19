import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import {
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "../utils/storage";

// API base URL belirleme
const getBaseUrl = (): string => {
  // expo config'den extra'yı al
  const extra =
    Constants.expoConfig?.extra ||
    (Constants.manifest2 as { extra?: Record<string, unknown> } | null)
      ?.extra ||
    (Constants.manifest as { extra?: Record<string, unknown> } | null)?.extra;

  // Production URL
  if (extra?.apiUrl && typeof extra.apiUrl === "string") {
    console.log("[API] Using production URL:", extra.apiUrl);
    return extra.apiUrl;
  }

  // Development host:port
  const apiHost = extra?.apiHost as string | undefined;
  const apiPort = (extra?.apiPort as string) || "50101";

  if (apiHost) {
    const url = `http://${apiHost}:${apiPort}/api`;
    console.log("[API] Using custom host:", url);
    return url;
  }

  // Expo debugger host
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (
      Constants.manifest2 as {
        extra?: { expoGo?: { debuggerHost?: string } };
      } | null
    )?.extra?.expoGo?.debuggerHost ||
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost;

  const debuggerHost = hostUri?.split(":")[0];

  if (debuggerHost) {
    const url = `http://${debuggerHost}:${apiPort}/api`;
    console.log("[API] Using debugger host:", url);
    return url;
  }

  // Fallback: Android emulator IP
  const fallbackUrl = `http://10.0.2.2:${apiPort}/api`;
  console.log("[API] Using emulator fallback:", fallbackUrl);
  return fallbackUrl;
};

const BASE_URL = getBaseUrl();
console.log("API Base URL:", BASE_URL);

// Retry konfigürasyonu
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1sn
  maxDelay: 8000, // max 8sn
};

// Retry sayıcı için extended config
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

// Axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30sn (AI işlemleri uzun sürebilir)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - token ekleme
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - hata yönetimi ve retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) {
      return Promise.reject(error);
    }

    // Retry sayıcı
    config._retryCount = config._retryCount ?? 0;

    // 401: Token yenileme dene
    if (error.response?.status === 401) {
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await saveTokens(accessToken, newRefreshToken);

          if (config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(config);
        }
      } catch (refreshError) {
        // Refresh başarısız, login'e yönlendir
        console.warn("[API] Token refresh failed:", refreshError);
        await clearAuthData();
        router.replace("/(auth)/login");
      }
      return Promise.reject(error);
    }

    // 4xx client hataları - retry yok
    if (
      error.response?.status &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      return Promise.reject(error);
    }

    // 5xx veya network hatası - retry
    const shouldRetry =
      (error.response?.status && error.response.status >= 500) ||
      error.code === "ECONNABORTED" ||
      error.message === "Network Error";

    if (shouldRetry && config._retryCount < RETRY_CONFIG.maxRetries) {
      config._retryCount += 1;

      // Exponential backoff (1s, 2s, 4s)
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, config._retryCount - 1),
        RETRY_CONFIG.maxDelay,
      );

      console.log(
        `Retry ${config._retryCount}/${RETRY_CONFIG.maxRetries} - ${delay}ms sonra tekrar denenecek`,
      );

      // Bekle ve tekrar dene
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  },
);

// API hata response tipi
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

// API başarılı response tipi
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

// Genel response union tipi
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Rate limit hatası kontrolü
export const isRateLimitError = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return error.response?.status === 429;
  }
  return false;
};

/**
 * API hata mesajı parse edici
 */
export const parseApiError = (error: unknown): string => {
  if (isAxiosError(error)) {
    // Rate limit
    if (error.response?.status === 429) {
      return "Çok fazla istek! Lütfen birkaç saniye bekleyin.";
    }

    // Backend hata response'u
    const apiError = error.response?.data as ApiError | undefined;
    const errorCode = apiError?.error?.code;
    const errorMessage = apiError?.error?.message;

    // Bilinen hata kodlarını çevir
    if (errorCode) {
      switch (errorCode) {
        case "PRODUCT_NOT_FOUND":
          return "Ürün bulunamadı ve AI hizmetine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.";
        case "AI_SERVICE_ERROR":
          return "AI hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
        case "AI_PARSE_ERROR":
          return "AI yanıtı işlenemedi. Lütfen tekrar sorgulayın.";
        case "INVALID_BARCODE":
          return "Geçersiz barkod formatı. Lütfen kontrol edip tekrar deneyin.";
        case "UNAUTHORIZED":
          return "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
        default:
          if (errorMessage) return errorMessage;
      }
    }

    // Backend mesajı
    if (errorMessage) {
      return errorMessage;
    }

    // Network hatası
    if (error.message === "Network Error") {
      return "Sunucuya bağlanılamadı. İnternet bağlantınızı ve backend'in çalıştığını kontrol edin.";
    }

    // timeout
    if (error.code === "ECONNABORTED") {
      return "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
    }

    // 5xx sunucu hatası
    if (error.response?.status && error.response.status >= 500) {
      return "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.";
    }
  }
  return "Beklenmeyen bir hata oluştu.";
};
