import {
    API_ENDPOINTS,
    type ConfirmRequest,
    type ConfirmResponse,
    type FlagBarcodeRequest,
    type FlagBarcodeResponse,
    type GenerateAnalysisRequest,
    type GenerateAnalysisResponse,
    type RejectAnalysisRequest,
    type RejectAnalysisResponse,
    type RejectContentRequest,
    type RejectContentResponse,
    type RejectProductRequest,
    type RejectProductResponse,
    type ScanRequest,
    type ScanResponse,
} from "@besin-denetle/shared";
import { api } from "./api";

/**
 * Barkod tara ve ürün getir
 */
export const scanBarcode = async (barcode: string): Promise<ScanResponse> => {
  const request: ScanRequest = { barcode };
  const response = await api.post<ScanResponse>(
    API_ENDPOINTS.PRODUCTS.SCAN,
    request,
  );
  return response.data;
};

/**
 * Ürünü onayla ve içerik getir
 */
export const confirmProduct = async (
  productId: string,
): Promise<ConfirmResponse> => {
  const request: ConfirmRequest = { productId };
  const response = await api.post<ConfirmResponse>(
    API_ENDPOINTS.PRODUCTS.CONFIRM,
    request,
  );
  return response.data;
};

/**
 * İçerik için analiz üret
 */
export const generateAnalysis = async (
  contentId: string,
): Promise<GenerateAnalysisResponse> => {
  const request: GenerateAnalysisRequest = { contentId };
  const response = await api.post<GenerateAnalysisResponse>(
    API_ENDPOINTS.ANALYSIS.GENERATE,
    request,
  );
  return response.data;
};

/**
 * Ürünü reddet, sonraki varyantı getir
 */
export const rejectProduct = async (
  productId: string,
  excludeIds?: string[],
): Promise<RejectProductResponse> => {
  const request: RejectProductRequest = { productId, excludeIds };
  const response = await api.post<RejectProductResponse>(
    API_ENDPOINTS.PRODUCTS.REJECT,
    request,
  );
  return response.data;
};

/**
 * İçeriği reddet, sonraki varyantı getir
 */
export const rejectContent = async (
  contentId: string,
  excludeIds?: string[],
): Promise<RejectContentResponse> => {
  const request: RejectContentRequest = { contentId, excludeIds };
  const response = await api.post<RejectContentResponse>(
    API_ENDPOINTS.CONTENT.REJECT,
    request,
  );
  return response.data;
};

/**
 * Analizi reddet, sonraki varyantı getir
 */
export const rejectAnalysis = async (
  analysisId: string,
  excludeIds?: string[],
): Promise<RejectAnalysisResponse> => {
  const request: RejectAnalysisRequest = { analysisId, excludeIds };
  const response = await api.post<RejectAnalysisResponse>(
    API_ENDPOINTS.ANALYSIS.REJECT,
    request,
  );
  return response.data;
};

/**
 * Non-food barkodu bildir
 */
export const flagBarcode = async (
  barcodeId: string,
): Promise<FlagBarcodeResponse> => {
  const request: FlagBarcodeRequest = { barcodeId };
  const response = await api.post<FlagBarcodeResponse>(
    API_ENDPOINTS.BARCODES.FLAG,
    request,
  );
  return response.data;
};
