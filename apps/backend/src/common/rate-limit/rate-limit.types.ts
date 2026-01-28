/**
 * Rate Limit Types
 */

// Tek bir limit kuralı
export interface RateLimitRule {
  limit: number;
  ttlSeconds: number;
}

// Redis key prefix'leri
export enum RateLimitKeyPrefix {
  // Pool limits
  SCAN_DB = 'rl:pool:scan_db',
  SCAN_AI = 'rl:pool:scan_ai',
  CONTENT_DB = 'rl:pool:content_db',
  CONTENT_AI = 'rl:pool:content_ai',
  ANALYSIS_DB = 'rl:pool:analysis_db',
  ANALYSIS_AI = 'rl:pool:analysis_ai',

  // Endpoint limits
  SCAN_REJECT = 'rl:ep:scan_reject',
  CONTENT_REJECT = 'rl:ep:content_reject',
  ANALYSIS_REJECT = 'rl:ep:analysis_reject',
  FLAG = 'rl:ep:flag',

  // Global limits
  TOTAL_DB_HOUR = 'rl:global:db_hour',
  TOTAL_DB_DAY = 'rl:global:db_day',
  TOTAL_AI_HOUR = 'rl:global:ai_hour',
  TOTAL_AI_DAY = 'rl:global:ai_day',
  TOTAL_REJECT_HOUR = 'rl:global:reject_hour',
  TOTAL_REJECT_DAY = 'rl:global:reject_day',

  // Auth limits (IP bazlı)
  AUTH_OAUTH = 'rl:auth:oauth',
  AUTH_EMAIL_SIGNUP = 'rl:auth:email_signup',
  AUTH_REGISTER = 'rl:auth:register',

  // Auth limits (User bazlı)
  AUTH_REFRESH = 'rl:auth:refresh',
  AUTH_LOGOUT = 'rl:auth:logout',
  AUTH_DELETE = 'rl:auth:delete',
  AUTH_RESTORE = 'rl:auth:restore',

  // Health check (IP bazlı)
  HEALTH = 'rl:health',
}

// Rate limit sonucu
export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

// Rate limit exception bilgisi
export interface RateLimitExceededInfo {
  key: string;
  limit: number;
  resetInSeconds: number;
}

// ============================================
// Config Interface'leri (type-safe erişim için)
// ============================================

export interface RateLimitPoolConfig {
  scan_db: RateLimitRule;
  scan_ai: RateLimitRule;
  content_db: RateLimitRule;
  content_ai: RateLimitRule;
  analysis_db: RateLimitRule;
  analysis_ai: RateLimitRule;
}

export interface RateLimitEndpointConfig {
  scan_reject: RateLimitRule;
  content_reject: RateLimitRule;
  analysis_reject: RateLimitRule;
  flag: RateLimitRule;
}

export interface RateLimitGlobalConfig {
  total_db_hour: RateLimitRule;
  total_db_day: RateLimitRule;
  total_ai_hour: RateLimitRule;
  total_ai_day: RateLimitRule;
  total_reject_hour: RateLimitRule;
  total_reject_day: RateLimitRule;
}

export interface RateLimitAuthConfig {
  oauth_ip: RateLimitRule;
  email_signup_ip: RateLimitRule;
  register_ip: RateLimitRule;
  refresh_ip: RateLimitRule;
  logout_user: RateLimitRule;
  delete_user: RateLimitRule;
  restore_user: RateLimitRule;
}

export interface RateLimitHealthConfig {
  check_ip: RateLimitRule;
}
