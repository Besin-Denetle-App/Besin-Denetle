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

Yanıtını SADECE aşağıdaki JSON formatında ver:
{
  "ingredients": "içindekiler listesi string olarak",
  "allergens": ["alerjen1", "alerjen2"],
  "nutrition": {
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
    "vitamins": {"vitaminC": 0, "vitaminD": 0},
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
