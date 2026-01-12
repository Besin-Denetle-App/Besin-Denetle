/**
 * Ürün detay sayfası için custom hook
 * API çağrıları ve state yönetimini merkezileştirir
 */
import { showInfoToast } from '@/components/feedback';
import type { IContentAnalysis, IProductContent } from '@besin-denetle/shared';
import { useCallback, useEffect, useState } from 'react';
import { parseApiError } from '../services/api';
import * as productService from '../services/product.service';
import { useHistoryStore } from '../stores/history.store';
import { useProductStore } from '../stores/product.store';
import { lightImpact } from '../utils/haptics';

interface UseProductDetailsResult {
  // State
  content: IProductContent | null;
  analysis: IContentAnalysis | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  rejectContent: () => Promise<void>;
  rejectAnalysis: () => Promise<void>;
}

/**
 * Ürün detaylarını yükler ve yönetir
 * @param productId - Ürün ID'si
 * @param isReadonly - Salt okunur mod (geçmişten açıldı mı)
 */
export function useProductDetails(
  productId: string,
  isReadonly: boolean
): UseProductDetailsResult {
  // Store'dan product ve barcode al
  const { currentProduct: product, currentBarcode: barcode } = useProductStore();
  const addToHistory = useHistoryStore((state) => state.addToHistory);

  // State
  const [content, setContent] = useState<IProductContent | null>(null);
  const [analysis, setAnalysis] = useState<IContentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ürün detaylarını yükle
  const loadProductDetails = useCallback(async () => {
    // Readonly modda API çağırma (geçmişten geldi, veriler store'da var)
    if (isReadonly) {
      const { currentContent, currentAnalysis } = useProductStore.getState();
      setContent(currentContent);
      setAnalysis(currentAnalysis);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await productService.confirmProduct(productId);
      setContent(response.content);
      setAnalysis(response.analysis);

      // Geçmişe kaydet (readonly değilse)
      if (product && barcode) {
        addToHistory({
          id: product.id,
          barcode,
          product,
          content: response.content,
          analysis: response.analysis,
        });
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [productId, isReadonly, product, barcode, addToHistory]);

  // Sayfa yüklendiğinde ürün detaylarını al
  useEffect(() => {
    if (productId) {
      loadProductDetails();
    }
  }, [productId, loadProductDetails]);

  // İçerik reddet
  const rejectContent = useCallback(async () => {
    if (!content) return;

    // Haptic feedback
    lightImpact();

    setIsLoading(true);
    try {
      const response = await productService.rejectContent(content.id);
      if (response.nextContent) {
        setContent(response.nextContent);
        setAnalysis(response.nextAnalysis);
        showInfoToast('Sonraki içerik yüklendi');
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [content]);

  // Analiz reddet
  const rejectAnalysis = useCallback(async () => {
    if (!analysis) return;

    // Haptic feedback
    lightImpact();

    setIsLoading(true);
    try {
      const response = await productService.rejectAnalysis(analysis.id);
      if (response.nextAnalysis) {
        setAnalysis(response.nextAnalysis);
        showInfoToast('Sonraki analiz yüklendi');
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [analysis]);

  return {
    content,
    analysis,
    isLoading,
    error,
    rejectContent,
    rejectAnalysis,
  };
}
