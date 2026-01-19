/**
 * Ürün varyantı arayüzü
 */
export interface IProduct {
  id: string;
  barcode_id: string;
  brand: string | null;
  name: string | null;
  quantity: string | null;
  image_url: string | null;
  score: number;
  vote_count: number;
  is_manual: boolean;
  created_at: Date;
}

/**
 * Ürün oluşturma için gerekli alanlar
 */
export interface ICreateProduct {
  barcode_id: string;
  brand?: string | null;
  name?: string | null;
  quantity?: string | null;
  image_url?: string | null;
  is_manual?: boolean;
}

/**
 * Besin değerleri tablosu (JSONB)
 */
export interface INutritionTable {
  [key: string]: string | number | undefined;
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  sugars?: number;
  fat?: number;
  saturatedFat?: number;
  fiber?: number;
  sodium?: number;
  salt?: number;
  _source?: string;
}

/**
 * Ürün içeriği arayüzü
 */
export interface IProductContent {
  id: string;
  product_id: string;
  ingredients: string | null;
  allergens: string | null;
  nutrition_table: INutritionTable | null;
  score: number;
  vote_count: number;
  is_manual: boolean;
  created_at: Date;
}

/**
 * Ürün içeriği oluşturma için gerekli alanlar
 */
export interface ICreateProductContent {
  product_id: string;
  ingredients?: string | null;
  allergens?: string | null;
  nutrition_table?: INutritionTable | null;
  is_manual?: boolean;
}

/**
 * AI analiz sonucu (JSONB)
 */
export interface IAnalysisResult {
  model: string;
  summary: string;
  healthScore: number;
  warnings: string[];
  positives: string[];
  recommendation: string;
}

/**
 * İçerik analizi arayüzü
 */
export interface IContentAnalysis {
  id: string;
  product_content_id: string;
  analysis_text: IAnalysisResult | null;
  score: number;
  vote_count: number;
  is_manual: boolean;
  created_at: Date;
}

/**
 * İçerik analizi oluşturma için gerekli alanlar
 */
export interface ICreateContentAnalysis {
  product_content_id: string;
  analysis_text?: IAnalysisResult | null;
  is_manual?: boolean;
}
