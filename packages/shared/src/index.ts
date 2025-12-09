// ============================================
// ENUMS
// ============================================

/**
 * Oy tipi
 */
export enum VoteType {
  UP = 'UP',
  DOWN = 'DOWN',
}

/**
 * Barkod durumu
 */
export enum BarcodeStatus {
  PENDING = 0, // AI henüz sorgulamadı
  ACTIVE = 1, // Besin ürünü, aktif
  REJECTED = 2, // Besin değil
}

// ============================================
// ENTITY TİPLERİ
// ============================================

/**
 * Barkod Entity
 */
export interface Barcode {
  id: string;
  code: string; // Barkod numarası
  status: BarcodeStatus;
  isFlagged: boolean; // Kullanıcı itiraz etti mi?
  createdAt: Date;
}

/**
 * Ürün Entity
 */
export interface Product {
  id: string;
  barcodeId: string; // FK -> Barcode
  brand: string | null;
  name: string;
  quantity: string | null; // "500g", "1L"
  isManual: boolean; // false=AI, true=Manuel
  isFlagged: boolean; // Hata var mı?
  createdAt: Date;
}

/**
 * Ürün İçeriği Entity (İçindekiler, Besin Değerleri)
 */
export interface ProductContent {
  id: string;
  productId: string; // FK -> Product
  ingredients: string | null;
  allergens: string | null;
  nutritionTable: NutritionTable | null;
  score: number; // Oy skoru
  voteCount: number; // Oy veren kişi sayısı
  isManual: boolean;
  createdAt: Date;
}

/**
 * İçerik Analizi Entity (AI Yorumu)
 */
export interface ContentAnalysis {
  id: string;
  productContentId: string; // FK -> ProductContent
  analysisText: string;
  score: number;
  voteCount: number;
  isManual: boolean;
  createdAt: Date;
}

/**
 * Oy Entity
 */
export interface Vote {
  id: string;
  userId: string; // Google Auth User ID
  productContentId: string | null; // FK -> ProductContent
  contentAnalysisId: string | null; // FK -> ContentAnalysis
  voteType: VoteType;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Beslenme Tablosu (JSONB)
 * Ürünün 100g veya 1 porsiyonundaki besin değerlerini tutar.
 */
export interface NutritionTable {
  servingSize?: string; // Porsiyon bilgisi (örn: "100g", "30ml")
  calories: number; // Kalori (kcal)
  protein: number; // Protein (gram)
  carbohydrates: number; // Karbonhidrat (gram)
  sugars?: number; // Şeker (gram) - Opsiyonel
  fat: number; // Yağ (gram)
  saturatedFat?: number; // Doymuş Yağ (gram) - Opsiyonel
  fiber?: number; // Lif (gram) - Opsiyonel
  sodium?: number; // Sodyum (mg) - Opsiyonel
  salt?: number; // Tuz (gram) - Opsiyonel
}

// ============================================
// DTO'LAR (Data Transfer Objects)
// ============================================

/**
 * Barkod sorgulama DTO
 */
export interface QueryBarcodeDto {
  code: string;
}

/**
 * Barkod oluşturma DTO
 */
export interface CreateBarcodeDto {
  code: string;
  status?: BarcodeStatus;
}

/**
 * Ürün oluşturma DTO
 */
export interface CreateProductDto {
  barcodeId: string;
  brand?: string;
  name: string;
  quantity?: string;
  isManual?: boolean;
}

/**
 * Ürün içeriği oluşturma DTO
 */
export interface CreateProductContentDto {
  productId: string;
  ingredients?: string;
  allergens?: string;
  nutritionTable?: NutritionTable;
  isManual?: boolean;
}

/**
 * İçerik analizi oluşturma DTO
 */
export interface CreateContentAnalysisDto {
  productContentId: string;
  analysisText: string;
  isManual?: boolean;
}

/**
 * Oy verme DTO
 */
export interface CreateVoteDto {
  userId: string;
  productContentId?: string;
  contentAnalysisId?: string;
  voteType: VoteType;
}

/**
 * Oy güncelleme DTO
 */
export interface UpdateVoteDto {
  voteType: VoteType;
}

/**
 * Flag DTO
 */
export interface FlagDto {
  userId: string;
  reason?: string;
}

// ============================================
// RESPONSE TİPLERİ
// ============================================

/**
 * Genel API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Barkod sorgulama sonucu
 */
export interface BarcodeQueryResponse {
  barcode: Barcode;
  products?: ProductDetail[]; // Eğer status=1 Active ise
  message?: string; // Eğer status=2 Rejected ise
}

/**
 * Ürün detayı (Tüm varyantlarla)
 */
export interface ProductDetail {
  product: Product;
  contents: ProductContentDetail[];
}

/**
 * İçerik detayı (Tüm analizlerle)
 */
export interface ProductContentDetail {
  content: ProductContent;
  analyses: ContentAnalysis[];
  userVote?: Vote; // Kullanıcının bu content için oyu
}

/**
 * Tam sayfa verisi
 */
export interface FullPageData {
  product: Product;
  displayedContent: ProductContent; // En yüksek skorlu
  displayedAnalysis: ContentAnalysis; // En yüksek skorlu
  userContentVote?: Vote;
  userAnalysisVote?: Vote;
  alternativeContents?: ProductContent[]; // Diğer varyantlar
  alternativeAnalyses?: ContentAnalysis[]; // Diğer varyantlar
}

/**
 * Oy verme sonucu
 */
export interface VoteResponse {
  vote: Vote;
  updatedScore: number;
  updatedVoteCount: number;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * EAN-13 barkod validasyonu
 */
export function isValidEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  const digits = barcode.split('').map(Number);
  const checksum = digits.pop()!;

  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);

  const calculatedChecksum = (10 - (sum % 10)) % 10;

  return checksum === calculatedChecksum;
}

/**
 * Barkod formatı validasyonu (EAN-13, EAN-8, UPC-A)
 */
export function isValidBarcode(barcode: string): boolean {
  if (/^\d{13}$/.test(barcode)) return isValidEAN13(barcode);
  if (/^\d{8}$/.test(barcode)) return true; // EAN-8
  if (/^\d{12}$/.test(barcode)) return true; // UPC-A
  return false;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Maksimum varyant limitleri
 */
export const MAX_VARIANTS = {
  CONTENTS_PER_PRODUCT: 3,
  ANALYSES_PER_CONTENT: 3,
} as const;

/**
 * Score değişim değerleri
 */
export const SCORE_CHANGES = {
  NEW_UPVOTE: 1,
  NEW_DOWNVOTE: -1,
  UP_TO_DOWN: -2,
  DOWN_TO_UP: 2,
} as const;
