import { Injectable } from '@nestjs/common';

/**
 * AI Prompt Service
 * Tüm Gemini API promptlarını merkezi olarak yönetir.
 *
 * Prompt 1-2 için V1/V2 versiyonları:
 * - V1: Schema-uyumlu (JSON talimatı yok, schema zaten zorluyor)
 * - V2: JSON talimatları dahil (backup model için, schema olmadan çalışır)
 *
 * @version 3.0 (Ocak 2026 - Fallback Sistemi)
 */
@Injectable()
export class AiPromptService {
  // ========== PROMPT 1: ÜRÜN TANIMLAMA ==========

  /**
   * PROMPT 1 - V1 (Primary): Schema-uyumlu
   * Grounding + Schema ile çalışır, JSON format talimatı yok
   */
  buildIdentifyProductPromptV1(barcode: string): string {
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
   * PROMPT 1 - V2 (Backup): JSON talimatları dahil
   * Sadece Grounding ile çalışır, Schema yok
   */
  buildIdentifyProductPromptV2(barcode: string): string {
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

Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir açıklama ekleme:
{
  "productType": 0,
  "confidence": 0,
  "product": {
    "brand": "marka veya null",
    "name": "ürün adı veya null",
    "quantity": "gramaj veya null"
  }
}`;
  }

  // ========== PROMPT 2: İÇERİK BİLGİSİ ==========

  /**
   * PROMPT 2 - V1 (Primary): Schema-uyumlu
   * Grounding + Schema ile çalışır, JSON format talimatı yok
   */
  buildGetProductContentPromptV1(
    brand: string | null,
    name: string | null,
    quantity: string | null,
  ): string {
    return `Sen bir gıda veri uzmanısın. Aşağıdaki ürünün içindekiler listesini ve besin değerlerini bul.

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

Bulduğun tüm verileri şemaya uygun doldur.`;
  }

  /**
   * PROMPT 2 - V2 (Backup): JSON talimatları dahil
   * Sadece Grounding ile çalışır, Schema yok
   */
  buildGetProductContentPromptV2(
    brand: string | null,
    name: string | null,
    quantity: string | null,
  ): string {
    return `Sen bir gıda veri uzmanısın. Aşağıdaki ürünün içindekiler listesini ve besin değerlerini bul.

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

Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir açıklama ekleme:
{
  "ingredients": "içindekiler listesi string olarak veya null",
  "allergens": ["alerjen1", "alerjen2"],
  "nutrition": {
    "servingSize": "100g",
    "energy": 0,
    "fat": 0,
    "saturatedFat": 0,
    "cholesterol": 0,
    "carbohydrates": 0,
    "sugars": 0,
    "polyols": 0,
    "starch": 0,
    "fiber": 0,
    "protein": 0,
    "salt": 0,
    "vitamins": null,
    "minerals": null
  }
}`;
  }

  // ========== PROMPT 3: SAĞLIK ANALİZİ ==========

  /**
   * PROMPT 3: Sağlık Analizi
   * İçerik bilgisine göre sağlık değerlendirmesi
   * Structured Output (Google Search yok) - Fallback yok
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
Motto: "Gıdayı hem işlenme derecesine (NOVA) hem de besin kalitesine (Nutri-Score) göre bütüncül değerlendir."

ÜRÜN BİLGİSİ:
- Marka: ${brand || 'Bilinmiyor'}
- İsim: ${name || 'Bilinmiyor'}

İÇİNDEKİLER (NOVA için kritik):
${ingredients || 'Bilinmiyor'}

ALERJENLER:
${allergens || 'Bilinmiyor'}

BESİN DEĞERLERİ (100g başına - Nutri-Score için kritik):
${nutritionStr}

GÖREVLER:
1. NOVA Analizi (İşlenme Derecesi):
- İçindekiler listesini analiz et ve ürünü 1-4 arasında sınıflandır.
   - NOVA 1: İşlenmemiş/Minimal
   - NOVA 2: İşlenmiş Mutfak Malzemeleri
   - NOVA 3: İşlenmiş Gıdalar
   - NOVA 4: Ultra İşlenmiş (Aroma, renklendirici, emülgatör vb. içerenler)
   *Karar gerekçeni kısaca belirt.*

2. Nutri-Score Tahmini (Besin Kalitesi):
   - Verilen besin değerlerini (Enerji, Şeker, Doymuş Yağ, Tuz vs. Protein, Lif) baz alarak A, B, C, D, E harflerinden birini ata.
   - A (Yeşil/En İyi) -> E (Kırmızı/En Kötü).
   - Eğer besin değerleri eksikse, içindekiler listesine bakarak eğitimli bir tahminde bulun.

3. Katkı Maddesi Analizi:
   - Riskli E-kodlarını veya şüpheli bileşenleri tespit et.

4. Genel Sağlık Puanı (1-10):
   - NOVA ve Nutri-Score sonuçlarını birleştirerek nihai bir puan ver.

   PUANLAMA MATRİSİ:
   - 8-10 (Yeşil): NOVA 1-2 VE Nutri-Score A-B (Doğal ve Besleyici).
   - 5-7 (Turuncu): NOVA 3 veya Nutri-Score C-D (Bazı kusurları var).
   - 1-4 (Kırmızı): NOVA 4 veya Nutri-Score E (Ultra işlenmiş veya besin değeri çok düşük).

5. Sonuç Özeti:
   - Kullanıcıya "Neden bu puanı aldı?" sorusunu cevaplayan, hem iyi hem kötü yönleri içeren kısa, net uyarılar ve övgüler yaz.

Yanıtını TÜRKÇE olarak ver. Çıktıyı şemaya uygun olarak doldur.`;
  }
}
