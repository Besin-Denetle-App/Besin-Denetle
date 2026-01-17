/**
 * Environment validation
 * Uygulama başlarken zorunlu ortam değişkenlerini kontrol eder.
 * Eksik değişken varsa uygulama başlamaz.
 */

// Zorunlu ortam değişkenleri
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

// Opsiyonel ama önerilen
const recommendedEnvVars = ['GEMINI_API_KEY', 'GOOGLE_WEB_CLIENT_ID'] as const;

/**
 * Ortam değişkenlerini doğrular.
 * Zorunlu değişkenler eksikse Error fırlatır.
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Zorunlu değişkenleri kontrol et
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] || process.env[envVar]?.trim() === '') {
      missing.push(envVar);
    }
  }

  // Önerilen değişkenleri kontrol et
  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar] || process.env[envVar]?.trim() === '') {
      warnings.push(envVar);
    }
  }

  // Uyarıları logla
  if (warnings.length > 0) {
    console.warn(
      `⚠️  Önerilen ortam değişkenleri eksik: ${warnings.join(', ')}`,
    );
  }

  // Zorunlu değişkenler eksikse hata fırlat
  if (missing.length > 0) {
    throw new Error(
      `❌ Zorunlu ortam değişkenleri eksik: ${missing.join(', ')}\n` +
        `Lütfen .env dosyasını kontrol edin.`,
    );
  }

  console.log('✅ Tüm zorunlu ortam değişkenleri mevcut');
}
