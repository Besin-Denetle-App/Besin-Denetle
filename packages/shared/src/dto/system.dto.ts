/**
 * Sistem DTO'ları
 * Health check ve error response tipleri
 */

/**
 * Health Check yanıtı
 * GET /api/health endpoint'i için
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number; // Saniye cinsinden
  environment?: string;
}

/**
 * Standart API hata formatı
 * Global Exception Filter tarafından döndürülür
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // HTTP status code veya özel hata kodu
    message: string; // Kullanıcıya gösterilebilir mesaj
    timestamp: string; // ISO format
    path?: string; // İstek yolu
    details?: Record<string, unknown>; // Ek detaylar (validation hataları vb.)
  };
}

/**
 * Standart API başarı formatı
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp?: string;
}

/**
 * Genel API yanıt tipi
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
