/**
 * AI Prompt Şablonları
 * 3 Aşamalı sistem: Product → Content → Analysis
 */

/**
 * Prompt 1: Ürün Kimliği
 * Barkod numarasından ürün bilgisi çıkarır
 */
export const PRODUCT_PROMPT = (barcode: string): string => `
Sen bir gıda uzmanısın. Aşağıdaki barkod numarasına sahip ürünü web'de ara.

Barkod: ${barcode}

ÖNEMLİ KURALLAR:
1. Eğer bu bir GIDA veya İÇECEK ürünü DEĞİLSE: {"isFood": false}
2. Bulamadığın alanları null bırak, tahmin etme.
3. Sadece JSON döndür.

{
  "isFood": true,
  "product": {
    "brand": "Marka adı",
    "name": "Ürün adı",
    "quantity": "Gramaj (örn: 500g, 1L)"
  }
}
`;

/**
 * Prompt 2: İçerik Bilgisi
 * Ürün bilgisinden içindekiler, alerjenler ve besin değerleri çıkarır
 */
export const CONTENT_PROMPT = (
  brand: string | null,
  name: string | null,
  quantity: string | null,
): string => `
Sen bir gıda uzmanısın. Aşağıdaki ürünün içindekiler listesini ve besin değerlerini bul.

ÜRÜN:
- Marka: ${brand ?? 'Bilinmiyor'}
- İsim: ${name ?? 'Bilinmiyor'}
- Gramaj: ${quantity ?? 'Bilinmiyor'}

Sadece JSON döndür:
{
  "ingredients": "İçindekiler listesi (virgülle ayrılmış)",
  "allergens": "Alerjen bilgisi",
  "nutrition": {
    "servingSize": "100g",
    "calories": 0,
    "protein": 0,
    "carbohydrates": 0,
    "sugars": 0,
    "fat": 0,
    "saturatedFat": 0,
    "fiber": 0,
    "sodium": 0,
    "salt": 0
  }
}
`;

/**
 * Prompt 3: Sağlık Analizi
 * İçerik bilgisinden sağlık değerlendirmesi üretir
 */
export const ANALYSIS_PROMPT = (
  brand: string | null,
  name: string | null,
  ingredients: string | null,
  allergens: string | null,
  nutrition: Record<string, unknown> | null,
): string => `
Sen bir beslenme uzmanısın. Aşağıdaki gıda ürününü sağlık açısından değerlendir.
Yanıtını TÜRKÇE olarak ver.

ÜRÜN BİLGİSİ:
- Marka: ${brand ?? 'Bilinmiyor'}
- İsim: ${name ?? 'Bilinmiyor'}

İÇİNDEKİLER:
${ingredients ?? 'Bilinmiyor'}

ALERJENLER:
${allergens ?? 'Belirtilmemiş'}

BESİN DEĞERLERİ (100g başına):
${nutrition ? JSON.stringify(nutrition, null, 2) : 'Bilinmiyor'}

Aşağıdaki JSON formatında yanıt ver:
{
  "model": "gemini-2.0-flash",
  "summary": "2-3 cümlelik genel değerlendirme (Türkçe)",
  "healthScore": 1-10,
  "warnings": ["Dikkat edilmesi gereken noktalar"],
  "positives": ["Olumlu yönler"],
  "recommendation": "Tüketim önerisi"
}
`;

/**
 * AI yanıtını parse et
 */
export function parseAIResponse<T>(response: string): T | null {
  try {
    // JSON bloğunu bul
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
