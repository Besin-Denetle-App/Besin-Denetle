import { Type } from '@google/genai';

/**
 * AI Response Schema Tanımları
 * Gemini 3 Structured Output için schema'lar
 */

/**
 * PROMPT 1: Ürün Tanımlama Schema'sı
 * Google Search + Structured Output
 */
export const IDENTIFY_PRODUCT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    productType: {
      type: Type.NUMBER,
      description: '0=Belirsiz, 1=Gıda, 2=İçecek, 3=Evcil, 9=Diğer',
    },
    confidence: {
      type: Type.NUMBER,
      description: '0-100 arası güven skoru',
    },
    product: {
      type: Type.OBJECT,
      properties: {
        brand: { type: Type.STRING, nullable: true },
        name: { type: Type.STRING, nullable: true },
        quantity: {
          type: Type.STRING,
          nullable: true,
          description: 'Örn: 500g, 1L',
        },
      },
      required: ['brand', 'name', 'quantity'],
    },
  },
  required: ['productType', 'confidence', 'product'],
};

/**
 * PROMPT 2: İçerik Bilgisi Schema'sı
 * Google Search + Structured Output
 */
export const GET_PRODUCT_CONTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.STRING,
      nullable: true,
      description: 'Temiz hammadde listesi',
    },
    allergens: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
      description: 'Tespit edilen alerjenlerin listesi (yoksa null)',
    },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        servingSize: {
          type: Type.STRING,
          description: "Her zaman '100g' veya '100ml'",
        },
        calories: { type: Type.NUMBER, description: 'kcal cinsinden' },
        protein: { type: Type.NUMBER },
        carbohydrates: { type: Type.NUMBER },
        sugars: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
        saturatedFat: { type: Type.NUMBER, nullable: true },
        fiber: { type: Type.NUMBER },
        sodium: { type: Type.NUMBER, nullable: true },
        salt: { type: Type.NUMBER, description: 'Tuz (g)' },
        vitamins: {
          type: Type.OBJECT,
          nullable: true,
          description: 'Vitaminler (örn: {"vitamin_c": 10, "vitamin_d": 5})',
        },
        minerals: {
          type: Type.OBJECT,
          nullable: true,
          description: 'Mineraller (örn: {"calcium": 120, "iron": 2})',
        },
      },
      required: [
        'servingSize',
        'calories',
        'protein',
        'carbohydrates',
        'sugars',
        'fat',
        'salt',
      ],
    },
  },
  required: ['ingredients', 'allergens', 'nutrition'],
};

/**
 * PROMPT 3: Sağlık Analizi Schema'sı
 * Sadece Structured Output (Search yok)
 */
export const ANALYZE_CONTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: '3-5 cümlelik genel değerlendirme',
    },
    healthScore: {
      type: Type.NUMBER,
      description: '1-10 arası sağlık puanı',
    },
    novaGroup: {
      type: Type.NUMBER,
      description: '1-4 arası NOVA grubu',
    },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Kısa uyarı etiketleri (örn: 'Yüksek Şeker')",
    },
    positives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Kısa olumlu etiketler (örn: 'Protein Kaynağı')",
    },
    warning_summary: {
      type: Type.STRING,
      description: 'Risklerin detaylı paragraf açıklaması',
    },
    positive_summary: {
      type: Type.STRING,
      description: 'Olumlu yönlerin detaylı paragraf açıklaması',
    },
    recommendation: {
      type: Type.STRING,
      description: '3-4 cümlelik tüketim tavsiyesi',
    },
  },
  required: [
    'summary',
    'healthScore',
    'novaGroup',
    'warnings',
    'positives',
    'warning_summary',
    'positive_summary',
    'recommendation',
  ],
};
