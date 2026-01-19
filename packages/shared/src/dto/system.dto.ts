/**
 * System DTO
 */

/**
 * Health Check yanıtı
 */
export interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number; // Saniye cinsinden
  environment?: string;
}

/**
 * API hata formatı
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
 * API başarı formatı
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp?: string;
}

/**
 * API yanıt tipi
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
