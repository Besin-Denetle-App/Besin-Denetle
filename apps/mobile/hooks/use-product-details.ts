/**
 * Ürün detay sayfası hook'u
 * İki aşamalı fetch: önce content, sonra analysis.
 */
import { showErrorToast, showInfoToast } from "@/components/feedback";
import type { IContentAnalysis, IProductContent } from "@besin-denetle/shared";
import { useCallback, useEffect, useState } from "react";
import { parseApiError } from "../services/api";
import * as productService from "../services/product.service";
import { useHapticsStore } from "../stores/haptics.store";
import { useHistoryStore } from "../stores/history.store";
import { useProductStore } from "../stores/product.store";

interface UseProductDetailsResult {
  // State fields
  content: IProductContent | null;
  analysis: IContentAnalysis | null;
  isLoading: boolean;
  isAnalysisLoading: boolean;
  analysisError: boolean;
  error: string | null;

  // Action methods
  rejectContent: () => Promise<void>;
  rejectAnalysis: () => Promise<void>;
  retryAnalysis: () => void;
}

/**
 * Ürün detaylarını yükler
 */
export function useProductDetails(
  productId: string,
  isReadonly: boolean,
): UseProductDetailsResult {
  // Store'dan gerekli değerleri al
  const { currentProduct: product, currentBarcode: barcode } =
    useProductStore();
  const { addToHistory, updateHistoryAnalysis } = useHistoryStore();
  const medium = useHapticsStore((state) => state.medium);
  const hapticSuccess = useHapticsStore((state) => state.success);
  const hapticError = useHapticsStore((state) => state.error);

  // State
  const [content, setContent] = useState<IProductContent | null>(null);
  const [analysis, setAnalysis] = useState<IContentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectedContentIds, setRejectedContentIds] = useState<string[]>([]);
  const [rejectedAnalysisIds, setRejectedAnalysisIds] = useState<string[]>([]);

  // Analiz yükleyici
  const loadAnalysis = useCallback(
    async (contentId: string) => {
      setIsAnalysisLoading(true);
      setAnalysisError(false);
      try {
        const response = await productService.generateAnalysis(contentId);
        setAnalysis(response.analysis);

        // Geçmişi analiz ile güncelle
        if (product && !isReadonly) {
          updateHistoryAnalysis(product.id, response.analysis);
        }
      } catch (err) {
        console.error("Analiz yüklenemedi:", err);
        setAnalysisError(true);
        showErrorToast("Analiz yüklenemedi");
      } finally {
        setIsAnalysisLoading(false);
      }
    },
    [product, isReadonly, updateHistoryAnalysis],
  );

  // Analiz retry
  const retryAnalysis = useCallback(() => {
    if (content) {
      loadAnalysis(content.id);
    }
  }, [content, loadAnalysis]);

  // Ürün detaylarını yükle (iki aşamalı)
  const loadProductDetails = useCallback(async () => {
    // Readonly modda API çağırmadan store'dan al
    if (isReadonly) {
      const { currentContent, currentAnalysis } = useProductStore.getState();
      setContent(currentContent);
      setAnalysis(currentAnalysis);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysisError(false);

    try {
      // 1. Content al
      const confirmResponse = await productService.confirmProduct(productId);

      // Content null kontrolü
      if (!confirmResponse.content) {
        setError("İçerik alınamadı");
        setIsLoading(false);
        return;
      }

      setContent(confirmResponse.content);
      setIsLoading(false);

      // Geçmişe kaydet (analysis null ile)
      if (product && barcode) {
        addToHistory({
          id: product.id,
          barcode,
          product,
          content: confirmResponse.content,
          analysis: null,
        });

        // 2. Analysis al (arka planda)
        loadAnalysis(confirmResponse.content.id);
      }
    } catch (err) {
      hapticError();
      setError(parseApiError(err));
      setIsLoading(false);
    }
  }, [
    productId,
    isReadonly,
    product,
    barcode,
    addToHistory,
    loadAnalysis,
    hapticError,
  ]);

  // Sayfa yüklendiğinde ürün detaylarını al
  useEffect(() => {
    if (productId) {
      loadProductDetails();
    }
  }, [productId, loadProductDetails]);

  // İçerik reddet - yeni content + analysis al
  const rejectContent = useCallback(async () => {
    if (!content || isLoading) return; // Çift tıklama koruması

    medium();
    setIsLoading(true);
    setAnalysis(null);
    setAnalysisError(false);
    setRejectedAnalysisIds([]); // Yeni content için listeyi sıfırla

    try {
      // Şu anki içeriği reddedilenler listesine ekle
      const currentRejectedIds = [...rejectedContentIds, content.id];
      setRejectedContentIds(currentRejectedIds);

      const response = await productService.rejectContent(
        content.id,
        currentRejectedIds,
      );
      if (response.nextContent) {
        setContent(response.nextContent);
        setIsLoading(false);
        hapticSuccess(); // Başarı titreşimi
        showInfoToast("Yeni içerik yüklendi");

        // Geçmişi yeni content ile güncelle (analysis null)
        if (product && barcode && !isReadonly) {
          addToHistory({
            id: product.id,
            barcode,
            product,
            content: response.nextContent,
            analysis: null,
          });

          // Yeni content için analysis al
          loadAnalysis(response.nextContent.id);
        }
      }
    } catch (err) {
      hapticError();
      setError(parseApiError(err));
      setIsLoading(false);
    }
  }, [
    content,
    product,
    barcode,
    isReadonly,
    rejectedContentIds,
    addToHistory,
    loadAnalysis,
    medium,
    hapticSuccess,
    hapticError,
  ]);

  // Analiz reddet (content aynı kalır)
  const rejectAnalysis = useCallback(async () => {
    if (!analysis || isAnalysisLoading) return; // Çift tıklama koruması

    medium();
    setIsAnalysisLoading(true);
    setAnalysisError(false);

    try {
      // Şu anki analizi reddedilenler listesine ekle
      const currentRejectedIds = [...rejectedAnalysisIds, analysis.id];
      setRejectedAnalysisIds(currentRejectedIds);

      const response = await productService.rejectAnalysis(
        analysis.id,
        currentRejectedIds,
      );
      if (response.nextAnalysis) {
        setAnalysis(response.nextAnalysis);
        hapticSuccess(); // Başarı titreşimi
        showInfoToast("Yeni AI analizi yüklendi");

        // Geçmişi yeni analysis ile güncelle
        if (product && !isReadonly) {
          updateHistoryAnalysis(product.id, response.nextAnalysis);
        }
      }
    } catch (err) {
      hapticError();
      setError(parseApiError(err));
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [
    analysis,
    product,
    isReadonly,
    rejectedAnalysisIds,
    updateHistoryAnalysis,
    medium,
    hapticSuccess,
    hapticError,
  ]);

  return {
    content,
    analysis,
    isLoading,
    isAnalysisLoading,
    analysisError,
    error,
    rejectContent,
    rejectAnalysis,
    retryAnalysis,
  };
}
