import { IAnalysisResult, IContentAnalysis, INutritionTable, IProduct, IProductContent } from '../types';
export interface ScanRequest {
    barcode: string;
}
export interface ScanResponse {
    product: IProduct;
    isNew: boolean;
    barcodeType: number;
}
export interface ConfirmRequest {
    productId: string;
}
export interface ConfirmResponse {
    content: IProductContent | null;
    analysis: IContentAnalysis | null;
    isContentNew: boolean;
    isAnalysisNew: boolean;
}
export interface RejectProductRequest {
    productId: string;
}
export interface RejectProductResponse {
    nextProduct: IProduct | null;
    isNew: boolean;
    noMoreVariants: boolean;
}
export interface RejectContentRequest {
    contentId: string;
}
export interface RejectContentResponse {
    nextContent: IProductContent | null;
    nextAnalysis: IContentAnalysis | null;
    isContentNew: boolean;
    isAnalysisNew: boolean;
    noMoreVariants: boolean;
}
export interface RejectAnalysisRequest {
    analysisId: string;
}
export interface RejectAnalysisResponse {
    nextAnalysis: IContentAnalysis | null;
    isNew: boolean;
    noMoreVariants: boolean;
}
export interface AIProductResult {
    isFood: boolean;
    product: {
        brand: string | null;
        name: string | null;
        quantity: string | null;
    } | null;
}
export interface AIContentResult {
    ingredients: string | null;
    allergens: string | null;
    nutrition: INutritionTable | null;
}
export interface AIAnalysisResult extends IAnalysisResult {
}
