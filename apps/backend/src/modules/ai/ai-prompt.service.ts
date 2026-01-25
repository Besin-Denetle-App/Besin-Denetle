import { Injectable } from '@nestjs/common';

/**
 * AI Prompt Service
 * Tüm Gemini API promptlarını merkezi olarak yönetir.
 * Promptları düzenlemek, versiyonlamak ve A/B test yapmak için kullanılır.
 *
 * NOT: JSON format talimatları kaldırıldı çünkü Structured Output (responseSchema) kullanılıyor.
 *
 * @version 2.0 (Ocak 2026 - Gemini 3 + Structured Output)
 */
@Injectable()
export class AiPromptService {
  /**
   * PROMPT 1: Ürün Tanımlama
   * Barkoddan marka/isim/gramaj bilgisi çeker
   * Google Search grounding + Structured Output
   */
  buildIdentifyProductPrompt(barcode: string): string {
    return `Sen Türkiye pazarındaki ürünler konusunda uzmanlaşmış bir veri asistanısın.
Aşağıdaki barkod numarasına sahip ürünü web'de detaylıca ara.

Barkod: ${barcode}

ÜRÜN TİPİ BELİRLEME KURALLARI:
0 = Belirsiz (ürünü bulamadın veya emin değilsin)
1 = İnsan yiyeceği (gıda, yemek, bisküvi, çikolata, süt ürünleri, meyve, sebze vb.)
2 = İnsan içeceği (su, meyve suyu, çay, kahve, enerji içeceği vb.)
3 = Evcil hayvan yiyeceği/içeceği (kedi maması, köpek maması, kuş yemi vb.)
9 = Diğer (gıda değil - elektronik, giyim, kozmetik, oyuncak vb.)

ÖNEMLİ KURALLAR:
1. Ürün tipini yukarıdaki kurallara göre belirle.
2. Gramaj bilgisini başlık ve açıklamalardan hassas şekilde çek.
3. Bulamadığın alanları null bırak, tahmin etme.
4. Eğer ürünü kesin bulamazsan confidence skorunu 50'nin altına düşür.
5. Ürünü net bulduysan confidence skoru 70-100 arası olmalı.

Bulduğun tüm verileri şemaya uygun doldur.`;
  }

  /**
   * PROMPT 2: İçerik Bilgisi
   * Ürünün içindekiler listesi + besin değerleri
   * Google Search grounding + Structured Output
   */
  buildGetProductContentPrompt(
    brand: string | null,
    name: string | null,
    quantity: string | null,
  ): string {
    return `Sen bir gıda veri uzmanısın. Aşağıdaki ürünün gerçek paket verilerini web'de bul.

ÜRÜN BİLGİSİ:
- Marka: ${brand || 'Bilinmiyor'}
- İsim: ${name || 'Bilinmiyor'}
- Gramaj: ${quantity || 'Bilinmiyor'}

ÖNEMLİ KURALLAR:
1. İçindekiler listesini temiz ve düzgün formatta yaz.
2. Alerjenleri ayrı ayrı dizi olarak belirt (örn: ["Gluten", "Süt", "Fındık"]).
3. Besin değerleri HER ZAMAN 100g (veya 100ml) başına olmalı.
4. Bulamadığın alanları null bırak, tahmin etme.
5. Sadece resmi/güvenilir kaynaklardan veri al.

Yanıtını SADECE aşağıdaki JSON formatında ver:
{
  "ingredients": "içindekiler listesi string olarak",
  "allergens": ["alerjen1", "alerjen2"],
  "nutrition": {
    "energy_kcal": 0,
    "fat": 0,
    "saturated_fat": 0,
    "carbohydrates": 0,
    "sugars": 0,
    "protein": 0,
    "salt": 0,
    "fiber": 0,
    "vitamins": {"vitamin_c": 0, "vitamin_d": 0},
    "minerals": {"calcium": 0, "iron": 0}
  }
}`;
  }

  /**
   * PROMPT 3: Sağlık Analizi
   * İçerik bilgisine göre sağlık değerlendirmesi
   * Structured Output (Google Search yok)
   */
  buildAnalyzeContentPrompt(
    brand: string | null,
    name: string | null,
    ingredients: string | null,
    allergens: string | null,
    nutrition: Record<string, unknown> | null,
  ): string {
    const nutritionStr = nutrition
      ? JSON.stringify(nutrition, null, 2)
      : 'Bilinmiyor';

    return `Sen Beslenme ve Gıda Güvenliği Uzmanısın.
Motto: "Hem içeriğin doğallığına (katkı maddeleri) hem de besin değerlerinin dengesine (şeker/protein) aynı anda odaklan."

ÜRÜN BİLGİSİ:
- Marka: ${brand || 'Bilinmiyor'}
- İsim: ${name || 'Bilinmiyor'}

İÇİNDEKİLER:
${ingredients || 'Bilinmiyor'}

ALERJENLER:
${allergens || 'Bilinmiyor'}

BESİN DEĞERLERİ (100g başına):
${nutritionStr}

GÖREVLER:
1. NOVA Analizi: Ürünü NOVA sınıflandırmasına (1-4) göre değerlendir.
   - NOVA 1: İşlenmemiş veya minimal işlenmiş gıdalar
   - NOVA 2: İşlenmiş mutfak malzemeleri
   - NOVA 3: İşlenmiş gıdalar
   - NOVA 4: Ultra işlenmiş gıdalar

2. Katkı Maddesi Analizi: Riskli E-kodlarını tespit et.

3. Sağlık Puanı (1-10): Aşağıdaki matrise göre puanla.

PUANLAMA MATRİSİ (MOBİL UYGULAMA RENKLERİNE GÖRE):
- 1-3 Puan (Kırmızı): Riskli/Kötü. NOVA 4, Çok yüksek şeker/tuz, Riskli katkılar.
- 4-6 Puan (Turuncu): Orta. Bazı iyi yönleri var ama kusurlu (örn: Doğal ama çok şekerli).
- 7-10 Puan (Yeşil): İyi/Mükemmel. NOVA 1-2, Katkısız, Dengeli.

4. Uyarılar ve Olumlu Yönler: Hem kısa etiketler hem de detaylı açıklamalar yaz.

Yanıtını TÜRKÇE olarak ver. Çıktıyı şemaya uygun olarak doldur.`;
  }
}
