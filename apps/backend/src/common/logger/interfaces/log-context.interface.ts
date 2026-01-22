// Request-scoped context bilgileri
// Her request için bu bilgileri tutuyoruz
export interface LogContext {
  // Her request için unique ID (UUID)
  requestId: string;

  // Giriş yapmış kullanıcı ID'si
  userId?: string;

  // istek atan IP adresi
  ipAddress?: string;

  // Tarayıcı bilgisi
  userAgent?: string;

  // Hangi endpoint'e istek atılmış
  endpoint?: string;

  // HTTP metodu (GET, POST, vs)
  method?: string;

  // İstek zamanı
  timestamp?: Date;
}

// Log metadata
// Kategoriye özel ek bilgiler
export interface LogMetadata {
  [key: string]: any;
}

// Log kategorileri
export enum LogCategory {
  HTTP = 'http',
  SECURITY = 'security',
  BUSINESS = 'business',
  ERROR = 'error',
  DATABASE = 'database',
  INFRASTRUCTURE = 'infrastructure',
}
