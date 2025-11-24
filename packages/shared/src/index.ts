// ============================================
// BARCODE TİPLERİ
// ============================================

export interface Barcode {
  value: string;
  type: BarcodeType;
  timestamp: number;
}

export type BarcodeType = 'ean13' | 'ean8' | 'upc_a' | 'upc_e' | 'code128' | 'code39';

// ============================================
// ÜRÜN TİPLERİ
// ============================================

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  categories?: string[];
  nutritionInfo?: NutritionInfo;
  ingredients?: string[];
  allergens?: string[];
  labels?: string[]; // Örn: "Vegan", "Gluten-free"
}

export interface NutritionInfo {
  servingSize?: string; // Örn: "100g"
  calories: number;
  protein: number;      // gram
  carbohydrates: number; // gram
  sugars?: number;      // gram
  fat: number;          // gram
  saturatedFat?: number; // gram
  fiber?: number;       // gram
  sodium?: number;      // mg
  salt?: number;        // gram
}

// ============================================
// NUTRI-SCORE
// ============================================

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export interface NutriScoreData {
  grade: NutriScore;
  score: number; // -15 ile +40 arası
}

// ============================================
// API RESPONSE TİPLERİ
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// UTILITY FONKSİYONLARI
// ============================================

/**
 * EAN-13 barkod validasyonu
 */
export function isValidEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  // Checksum kontrolü
  const digits = barcode.split('').map(Number);
  const checksum = digits.pop()!;
  
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  
  return checksum === calculatedChecksum;
}

/**
 * Barkod tipi validasyonu
 */
export function isValidBarcode(barcode: string, type?: BarcodeType): boolean {
  if (!type || type === 'ean13') {
    return isValidEAN13(barcode);
  }
  
  if (type === 'ean8') {
    return /^\d{8}$/.test(barcode);
  }
  
  if (type === 'upc_a') {
    return /^\d{12}$/.test(barcode);
  }
  
  // Diğer tipler için basit regex
  return barcode.length > 0;
}

/**
 * Nutri-Score hesaplama (basitleştirilmiş)
 * Gerçek algoritma çok daha karmaşık: https://www.santepubliquefrance.fr/
 */
export function calculateNutriScore(nutrition: NutritionInfo): NutriScoreData {
  // Bu basitleştirilmiş bir versiyondur
  // Gerçek Nutri-Score algoritması çok daha detaylıdır
  
  let score = 0;
  
  // Negatif puanlar (kötü öğeler)
  score += Math.min(Math.floor(nutrition.calories / 335) * 1, 10); // Kalori
  score += Math.min(Math.floor((nutrition.sugars || 0) / 4.5) * 1, 10); // Şeker
  score += Math.min(Math.floor(nutrition.saturatedFat || 0), 10); // Doymuş yağ
  score += Math.min(Math.floor((nutrition.sodium || 0) / 90) * 1, 10); // Sodyum
  
  // Pozitif puanlar (iyi öğeler) - çıkar
  score -= Math.min(Math.floor((nutrition.fiber || 0) / 0.9) * 1, 5); // Lif
  score -= Math.min(Math.floor(nutrition.protein / 1.6) * 1, 5); // Protein
  
  // Grade belirle
  let grade: NutriScore;
  if (score <= -1) grade = 'A';
  else if (score <= 2) grade = 'B';
  else if (score <= 10) grade = 'C';
  else if (score <= 18) grade = 'D';
  else grade = 'E';
  
  return { grade, score };
}

