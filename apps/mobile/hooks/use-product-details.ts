/**
 * Ürün detay sayfası için custom hook
 * 
 * API çağrıları ve state yönetimini merkezileştirir.
 * İçerik veya analiz reddedildiğinde geçmiş otomatik güncellenir.
 */
import { showInfoToast } from '@/components/feedback';
import type { IContentAnalysis, IProductContent } from '@besin-denetle/shared';
import { useCallback, useEffect, useState } from 'react';
import { parseApiError } from '../services/api';
import * as productService from '../services/product.service';
import { useHapticsStore } from '../stores/haptics.store';
import { useHistoryStore } from '../stores/history.store';
import { useProductStore } from '../stores/product.store';

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
  const medium = useHapticsStore((state) => state.medium);
  const hapticError = useHapticsStore((state) => state.error);

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

      // İlk yüklemede geçmişe kaydet
      // productId bazlı: aynı ürün varsa güncellenir, yoksa yeni kayıt oluşur
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
      hapticError(); // Hata titreşimi
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

  // İçerik reddet (domino etkisi: yeni content → yeni analysis)
  const rejectContent = useCallback(async () => {
    if (!content) return;

    medium();

    setIsLoading(true);
    try {
      const response = await productService.rejectContent(content.id);
      if (response.nextContent) {
        setContent(response.nextContent);
        setAnalysis(response.nextAnalysis);
        showInfoToast('Sonraki içerik yüklendi');

        // Geçmişi son content ve analysis ile güncelle
        // Aynı productId olduğu için mevcut kayıt güncellenir ve başa taşınır
        if (product && barcode && !isReadonly) {
          addToHistory({
            id: product.id,
            barcode,
            product,
            content: response.nextContent,
            analysis: response.nextAnalysis,
          });
        }
      }
    } catch (err) {
      hapticError(); // Hata titreşimi
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [content, product, barcode, isReadonly, addToHistory]);

  // Analiz reddet (sadece analysis değişir, content aynı kalır)
  const rejectAnalysis = useCallback(async () => {
    if (!analysis) return;

    medium();

    setIsLoading(true);
    try {
      const response = await productService.rejectAnalysis(analysis.id);
      if (response.nextAnalysis) {
        setAnalysis(response.nextAnalysis);
        showInfoToast('Sonraki analiz yüklendi');

        // Geçmişi mevcut content ve yeni analysis ile güncelle
        // Content değişmedi, sadece analysis yenilendi
        if (product && barcode && !isReadonly) {
          addToHistory({
            id: product.id,
            barcode,
            product,
            content,
            analysis: response.nextAnalysis,
          });
        }
      }
    } catch (err) {
      hapticError(); // Hata titreşimi
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [analysis, content, product, barcode, isReadonly, addToHistory]);

  return {
    content,
    analysis,
    isLoading,
    error,
    rejectContent,
    rejectAnalysis,
  };
}
