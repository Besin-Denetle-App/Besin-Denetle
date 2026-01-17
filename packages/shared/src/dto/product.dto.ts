import {
  IAnalysisResult,
  IContentAnalysis,
  INutritionTable,
  IProduct,
  IProductContent,
} from "../types";

// ==================== SCAN ====================

/**
 * Barkod tarama isteği
 */
export interface ScanRequest {
  barcode: string;
}

/**
 * Barkod tarama yanıtı
 */
export interface ScanResponse {
  product: IProduct;
  isNew: boolean; // AI tarafından yeni mi oluşturuldu
  barcodeType: number; // Ürün tipi (1=yiyecek, 2=içecek, 9=diğer)
}

// ==================== CONFIRM ====================

/**
 * Ürün onaylama isteği
 */
export interface ConfirmRequest {
  productId: string;
}

/**
 * Ürün onaylama yanıtı
 * Analysis ayrı endpoint'ten alınır
 */
export interface ConfirmResponse {
  content: IProductContent | null;
  isContentNew: boolean;
}

// ==================== REJECT ====================

/**
 * Ürün reddetme isteği
 */
export interface RejectProductRequest {
  productId: string;
  excludeIds?: string[]; // Önceki reddedilen ürünlerin ID'leri
}

/**
 * Ürün reddetme yanıtı
 */
export interface RejectProductResponse {
  nextProduct: IProduct | null; // Sıradaki varyant veya yeni AI ürünü
  isNew: boolean; // AI tarafından yeni mi oluşturuldu
  noMoreVariants: boolean; // Artık varyant kalmadı mı
}

/**
 * İçerik reddetme isteği
 */
export interface RejectContentRequest {
  contentId: string;
  excludeIds?: string[]; // Önceki reddedilen içeriklerin ID'leri
}

/**
 * İçerik reddetme yanıtı
 * Analysis ayrı endpoint'ten alınır
 */
export interface RejectContentResponse {
  nextContent: IProductContent | null;
  isContentNew: boolean;
  noMoreVariants: boolean;
}

/**
 * Analiz reddetme isteği
 */
export interface RejectAnalysisRequest {
  analysisId: string;
  excludeIds?: string[]; // Önceki reddedilen analizlerin ID'leri
}

/**
 * Analiz reddetme yanıtı
 */
export interface RejectAnalysisResponse {
  nextAnalysis: IContentAnalysis | null;
  isNew: boolean;
  noMoreVariants: boolean;
}

// ==================== GENERATE ANALYSIS ====================

/**
 * Analiz üretme isteği
 */
export interface GenerateAnalysisRequest {
  contentId: string;
}

/**
 * Analiz üretme yanıtı
 */
export interface GenerateAnalysisResponse {
  analysis: IContentAnalysis;
  isNew: boolean;
}

// ==================== AI PROMPTS ====================

/**
 * AI Prompt 1 yanıtı - Ürün kimliği
 */
export interface AIProductResult {
  isFood: boolean;
  product: {
    brand: string | null;
    name: string | null;
    quantity: string | null;
  } | null;
}

/**
 * AI Prompt 2 yanıtı - İçerik bilgisi
 */
export interface AIContentResult {
  ingredients: string | null;
  allergens: string | null;
  nutrition: INutritionTable | null;
  model: string;
}

/**
 * AI Prompt 3 yanıtı - Sağlık analizi
 */
export interface AIAnalysisResult extends IAnalysisResult {}

// ==================== FLAG ====================

/**
 * Barkod bildirme isteği
 */
export interface FlagBarcodeRequest {
  barcodeId: string;
}

/**
 * Barkod bildirme yanıtı
 */
export interface FlagBarcodeResponse {
  success: boolean;
}
