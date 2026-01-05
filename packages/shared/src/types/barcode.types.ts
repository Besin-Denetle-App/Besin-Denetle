/**
 * Ürün tipi enum
 * 0: Kararsız (AI emin değil)
 * 1: İnsan yiyeceği
 * 2: İnsan içeceği
 * 3: Evcil hayvan yiyeceği/içeceği
 * 9: Diğer (gıda değil)
 */
export enum ProductType {
  UNKNOWN = 0,
  FOOD = 1,
  BEVERAGE = 2,
  PET_FOOD = 3,
  OTHER = 9,
}

/**
 * Barkod arayüzü
 */
export interface IBarcode {
  id: string;
  code: string;
  type: ProductType;
  is_manual: boolean;
  is_flagged: boolean;
  created_at: Date;
}

/**
 * Barkod oluşturma için gerekli alanlar
 */
export interface ICreateBarcode {
  code: string;
  type?: ProductType;
  is_manual?: boolean;
}
