import { registerAs } from '@nestjs/config';

/**
 * Gemini AI model konfigürasyonu.
 * Model isimlerini değiştirmek için bu dosyayı düzenleyin.
 *
 * Mevcut modeller (Ocak 2026):
 * - gemini-2.5-flash / gemini-2.5-flash-lite (hızlı, ekonomik)
 * - gemini-2.5-pro (akıllı, detaylı analiz)
 * - gemini-3-flash / gemini-3-pro (en yeni sürümler)
 */
export default registerAs('ai', () => ({
  // Prompt 1-2: Ürün tanımlama ve içerik bulma (hızlı model)
  modelFast: process.env.GEMINI_MODEL_FAST || 'gemini-3-flash',

  // Prompt 3: Sağlık analizi (akıllı model)
  modelSmart: process.env.GEMINI_MODEL_SMART || 'gemini-3-pro',
}));

// Tip tanımı (ConfigService için)
export interface AiConfig {
  modelFast: string;
  modelSmart: string;
}
