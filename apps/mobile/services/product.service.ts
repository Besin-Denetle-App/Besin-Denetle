import type {
  ConfirmRequest,
  ConfirmResponse,
  FlagBarcodeRequest,
  FlagBarcodeResponse,
  RejectAnalysisRequest,
  RejectAnalysisResponse,
  RejectContentRequest,
  RejectContentResponse,
  RejectProductRequest,
  RejectProductResponse,
  ScanRequest,
  ScanResponse,
} from '@besin-denetle/shared';
import { api } from './api';

/**
 * Barkod tara - Ürün bilgisi getir veya AI ile oluştur
 */
export const scanBarcode = async (barcode: string): Promise<ScanResponse> => {
  const request: ScanRequest = { barcode };
  const response = await api.post<ScanResponse>('/products/scan', request);
  return response.data;
};

/**
 * Ürün onayla - İçerik ve analiz getir
 */
export const confirmProduct = async (productId: string): Promise<ConfirmResponse> => {
  const request: ConfirmRequest = { productId };
  const response = await api.post<ConfirmResponse>('/products/confirm', request);
  return response.data;
};

/**
 * Ürün reddet - Sonraki varyant veya yeni AI ürünü getir
 */
export const rejectProduct = async (productId: string): Promise<RejectProductResponse> => {
  const request: RejectProductRequest = { productId };
  const response = await api.post<RejectProductResponse>('/products/reject', request);
  return response.data;
};

/**
 * İçerik reddet - Sonraki içerik varyantı getir (domino etkisi)
 */
export const rejectContent = async (contentId: string): Promise<RejectContentResponse> => {
  const request: RejectContentRequest = { contentId };
  const response = await api.post<RejectContentResponse>('/content/reject', request);
  return response.data;
};

/**
 * Analiz reddet - Sonraki analiz varyantı getir
 */
export const rejectAnalysis = async (analysisId: string): Promise<RejectAnalysisResponse> => {
  const request: RejectAnalysisRequest = { analysisId };
  const response = await api.post<RejectAnalysisResponse>('/analysis/reject', request);
  return response.data;
};

/**
 * Barkod bildir - Non-food ürünü hatalı olarak bildir
 */
export const flagBarcode = async (barcodeId: string): Promise<FlagBarcodeResponse> => {
  const request: FlagBarcodeRequest = { barcodeId };
  const response = await api.post<FlagBarcodeResponse>('/barcodes/flag', request);
  return response.data;
};
