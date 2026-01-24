/**
 * @file product.types.ts
 * @description Ürün, içerik ve analiz tanımları
 * @package @besin-denetle/shared
 */

// ==================== ÜRÜN (Product) ====================

/**
 * Ürün varyantı arayüzü
 * Bir barkoda ait farklı ürün bilgisi varyantlarını temsil eder
 */
export interface IProduct {
  id: string;
  barcode_id: string;
  brand: string | null;
  name: string | null;
  quantity: string | null;           // Gramaj/miktar (örn: "500g", "1L")
  image_url: string | null;
  score: number;                     // Oylama skoru (UP +1, DOWN -1)
  vote_count: number;                // Toplam oy sayısı
  is_manual: boolean;                // Kullanıcı tarafından manuel mi eklendi
  created_at: Date;
}

/**
 * Ürün oluşturma DTO
 */
export interface ICreateProduct {
  barcode_id: string;
  brand?: string | null;
  name?: string | null;
  quantity?: string | null;
  image_url?: string | null;
  is_manual?: boolean;
}

// ==================== İÇERİK (Content) ====================

/**
 * Besin değerleri tablosu (JSONB)
 * Tüm değerler 100g/100ml başına
 */
export interface INutritionTable {
  [key: string]: string | number | undefined;  // Ek alanlar için esneklik
  servingSize?: string;              // Porsiyon boyutu (örn: "100g", "100ml")
  calories?: number;                 // Kalori (kcal)
  protein?: number;                  // Protein (g)
  carbohydrates?: number;            // Karbonhidrat (g)
  sugars?: number;                   // Şeker (g)
  fat?: number;                      // Yağ (g)
  saturatedFat?: number;             // Doymuş yağ (g)
  fiber?: number;                    // Lif (g)
  sodium?: number;                   // Sodyum (mg)
  salt?: number;                     // Tuz (g)
  _source?: string;                  // Veriyi sağlayan AI model adı
}

/**
 * Ürün içeriği arayüzü
 * Bir ürünün içindekiler, alerjenler ve besin değerlerini içerir
 */
export interface IProductContent {
  id: string;
  product_id: string;
  ingredients: string | null;        // İçindekiler listesi
  allergens: string | null;          // Alerjen bilgisi (virgülle ayrılmış)
  nutrition_table: INutritionTable | null;
  score: number;                     // Oylama skoru
  vote_count: number;                // Toplam oy sayısı
  is_manual: boolean;
  created_at: Date;
}

/**
 * Ürün içeriği oluşturma DTO
 */
export interface ICreateProductContent {
  product_id: string;
  ingredients?: string | null;
  allergens?: string | null;
  nutrition_table?: INutritionTable | null;
  is_manual?: boolean;
}

// ==================== ANALİZ (Analysis) ====================

/**
 * AI analiz sonucu (JSONB)
 * Prompt 3 çıktısı olarak DB'ye kaydedilir
 */
export interface IAnalysisResult {
  model: string;                // Kullanılan AI model adı (örn: gemini-3-pro-preview)
  summary: string;              // 3-5 cümlelik genel değerlendirme
  healthScore: number;          // 1-10 arası sağlık puanı (1=kötü, 10=mükemmel)
  novaGroup: number;            // 1-4 arası NOVA sınıflandırması (1=doğal, 4=ultra işlenmiş)
  warnings: string[];           // Kısa uyarı etiketleri (örn: "Yüksek Şeker", "E250")
  positives: string[];          // Kısa olumlu etiketler (örn: "Protein Kaynağı")
  warning_summary: string;      // Risklerin detaylı paragraf açıklaması
  positive_summary: string;     // Olumlu yönlerin detaylı paragraf açıklaması
  recommendation: string;       // Tüketim önerisi
}

/**
 * İçerik analizi arayüzü
 */
export interface IContentAnalysis {
  id: string;
  product_content_id: string;
  analysis_text: IAnalysisResult | null;
  score: number;                     // Oylama skoru
  vote_count: number;                // Toplam oy sayısı
  is_manual: boolean;
  created_at: Date;
}

/**
 * İçerik analizi oluşturma DTO
 */
export interface ICreateContentAnalysis {
  product_content_id: string;
  analysis_text?: IAnalysisResult | null;
  is_manual?: boolean;
}
