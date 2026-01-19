import type {
    ConfirmRequest,
    ConfirmResponse,
    FlagBarcodeRequest,
    FlagBarcodeResponse,
    GenerateAnalysisRequest,
    GenerateAnalysisResponse,
    RejectAnalysisRequest,
    RejectAnalysisResponse,
    RejectContentRequest,
    RejectContentResponse,
    RejectProductRequest,
    RejectProductResponse,
    ScanRequest,
    ScanResponse,
} from "@besin-denetle/shared";
import { api } from "./api";

/**
 * Barkod tara ve ürün getir
 */
export const scanBarcode = async (barcode: string): Promise<ScanResponse> => {
  const request: ScanRequest = { barcode };
  const response = await api.post<ScanResponse>("/products/scan", request);
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
    "/products/confirm",
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
    "/analysis/generate",
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
    "/products/reject",
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
    "/content/reject",
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
    "/analysis/reject",
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
    "/barcodes/flag",
    request,
  );
  return response.data;
};
