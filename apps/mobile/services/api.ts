import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { clearAuthData, getAccessToken, getRefreshToken, saveTokens } from '../utils/storage';

// Backend API base URL
// Production: API_URL kullan (tam URL)
// Development: API_HOST + API_PORT kullan (IP:Port)
const getBaseUrl = (): string => {
  // Extra config'i al (manifest2, manifest veya expoConfig'den)
  const extra = Constants.expoConfig?.extra || 
                (Constants.manifest2 as { extra?: Record<string, unknown> } | null)?.extra ||
                (Constants.manifest as { extra?: Record<string, unknown> } | null)?.extra;
  
  // 1. Production: API_URL varsa direkt kullan
  if (extra?.apiUrl && typeof extra.apiUrl === 'string') {
    console.log('[API] Using production URL:', extra.apiUrl);
    return extra.apiUrl;
  }
  
  // 2. Development: API_HOST + API_PORT kullan
  const apiHost = extra?.apiHost as string | undefined;
  const apiPort = (extra?.apiPort as string) || '3200';
  
  if (apiHost) {
    const url = `http://${apiHost}:${apiPort}/api`;
    console.log('[API] Using custom host:', url);
    return url;
  }
  
  // 3. Fallback: Expo debugger host kullan (otomatik)
  const hostUri = Constants.expoConfig?.hostUri || 
                  (Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | null)?.extra?.expoGo?.debuggerHost ||
                  (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost;
  
  const debuggerHost = hostUri?.split(':')[0];
  
  if (debuggerHost) {
    const url = `http://${debuggerHost}:${apiPort}/api`;
    console.log('[API] Using debugger host:', url);
    return url;
  }
  
  // 4. Son fallback: Android emülatör
  const fallbackUrl = `http://10.0.2.2:${apiPort}/api`;
  console.log('[API] Using fallback:', fallbackUrl);
  return fallbackUrl;
};

const BASE_URL = getBaseUrl();
console.log('API Base URL:', BASE_URL);

// Retry yapılandırması
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 saniye
  maxDelay: 8000, // 8 saniye
};

// Retry durumu için interface
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

// Axios instance oluştur
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 saniye (AI işlemleri uzun sürebilir)
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek gönderilmeden önce token ekle
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Yanıt alındıktan sonra hata yönetimi + Retry Logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) {
      return Promise.reject(error);
    }

    // Retry sayacını başlat
    config._retryCount = config._retryCount ?? 0;

    // 401 hatası - Token refresh
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
      } catch {
        await clearAuthData();
        router.replace('/(auth)/login');
      }
      return Promise.reject(error);
    }

    // 429 hatası - Rate Limiting (tekrar deneme YAPMA)
    if (error.response?.status === 429) {
      // Rate limit hatası, retry yapma, direkt hata döndür
      return Promise.reject(error);
    }

    // 4xx hataları - Client hatası (tekrar deneme YAPMA)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return Promise.reject(error);
    }

    // 5xx hataları veya network hatası - Retry yap
    const shouldRetry = 
      (error.response?.status && error.response.status >= 500) ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error';

    if (shouldRetry && config._retryCount < RETRY_CONFIG.maxRetries) {
      config._retryCount += 1;

      // Exponential backoff hesapla (1s, 2s, 4s)
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, config._retryCount - 1),
        RETRY_CONFIG.maxDelay
      );

      console.log(`Retry ${config._retryCount}/${RETRY_CONFIG.maxRetries} - ${delay}ms sonra tekrar denenecek`);

      // Bekle ve tekrar dene
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

// API hata tipi
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

// API başarı tipi
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

// Genel API yanıt tipi
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Rate limit hatası mı kontrol et
 */
export const isRateLimitError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 429;
  }
  return false;
};

/**
 * API hatalarını parse et
 */
export const parseApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Rate limit hatası
    if (error.response?.status === 429) {
      return 'Çok fazla istek! Lütfen birkaç saniye bekleyin.';
    }

    // Backend'den gelen hata mesajı
    const apiError = error.response?.data as ApiError | undefined;
    const errorCode = apiError?.error?.code;
    const errorMessage = apiError?.error?.message;

    // Özel hata kodlarına göre mesaj
    if (errorCode) {
      switch (errorCode) {
        case 'PRODUCT_NOT_FOUND':
          return 'Ürün bulunamadı ve AI hizmetine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.';
        case 'AI_SERVICE_ERROR':
          return 'AI hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
        case 'AI_PARSE_ERROR':
          return 'AI yanıtı işlenemedi. Lütfen tekrar sorgulayın.';
        case 'INVALID_BARCODE':
          return 'Geçersiz barkod formatı. Lütfen kontrol edip tekrar deneyin.';
        case 'UNAUTHORIZED':
          return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        default:
          if (errorMessage) return errorMessage;
      }
    }

    // Backend'den gelen message varsa
    if (errorMessage) {
      return errorMessage;
    }

    // Network hatası
    if (error.message === 'Network Error') {
      return 'Sunucuya bağlanılamadı. İnternet bağlantınızı ve backend\'in çalıştığını kontrol edin.';
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }

    // 5xx server hataları
    if (error.response?.status && error.response.status >= 500) {
      return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
    }
  }
  return 'Beklenmeyen bir hata oluştu.';
};
