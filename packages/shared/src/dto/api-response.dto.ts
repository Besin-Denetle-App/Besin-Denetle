/**
 * API Response Types
 * Backend ve Mobil'de ortak kullanılan API yanıt formatları
 */

/**
 * API hata formatı
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    path?: string;
    details?: Record<string, unknown>;
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
 * API yanıt tipi (union)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
