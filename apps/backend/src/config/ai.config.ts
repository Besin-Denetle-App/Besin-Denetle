import { registerAs } from '@nestjs/config';

/**
 * Gemini AI model konfigürasyonu.
 * Model isimlerini .env dosyasından ayarlayın.
 *
 * Prompt 1-2: Primary + Backup (fallback) modeli
 * Prompt 3: Sadece smart model
 */
export default registerAs('ai', () => ({
  // Prompt 1-2: Ürün tanımlama (primary model - Grounding + Schema)
  modelFast: process.env.GEMINI_MODEL_FAST || '',

  // Prompt 1-2: Fallback model (sadece Grounding, Schema yok)
  modelFastBackup: process.env.GEMINI_MODEL_FAST_BACKUP || '',

  // Prompt 3: Sağlık analizi (Schema)
  modelSmart: process.env.GEMINI_MODEL_SMART || '',
}));

// Tip tanımı
export interface AiConfig {
  modelFast: string;
  modelFastBackup: string;
  modelSmart: string;
}
