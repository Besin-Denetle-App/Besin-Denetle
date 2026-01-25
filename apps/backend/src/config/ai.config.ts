import { registerAs } from '@nestjs/config';

/**
 * AI Grounding Stratejisi
 * SCHEMA: Structured Output (responseSchema ile) - RECITATION riski var
 * PROMPT: Prompt-based JSON (responseSchema yok) - RECITATION'a dayanıklı
 */
export type GroundingStrategy = 'SCHEMA' | 'PROMPT';

/**
 * Gemini AI model konfigürasyonu.
 * Model isimlerini .env dosyasından ayarlayın.
 *
 * Mevcut modeller (Ocak 2026):
 * - Preview: gemini-3-flash-preview, gemini-3-pro-preview (şu an kullanılan)
 * - Stable: gemini-3-flash, gemini-3-pro
 * - Eski: gemini-2.5-flash, gemini-2.5-pro
 */
export default registerAs('ai', () => ({
  // Prompt 1-2: Ürün tanımlama (hızlı model)
  modelFast: process.env.GEMINI_MODEL_FAST || '',

  // Prompt 3: Sağlık analizi (akıllı model)
  modelSmart: process.env.GEMINI_MODEL_SMART || '',

  // Grounding stratejisi (SCHEMA veya PROMPT)
  groundingStrategy:
    (process.env.GEMINI_GROUNDING_STRATEGY as GroundingStrategy) || 'PROMPT',
}));

// Tip tanımı
export interface AiConfig {
  modelFast: string;
  modelSmart: string;
  groundingStrategy: GroundingStrategy;
}
