import type { IContentAnalysis, IProduct, IProductContent } from '@besin-denetle/shared';
import { create } from 'zustand';

interface ProductState {
  // State
  currentBarcode: string | null;
  currentProduct: IProduct | null;
  currentContent: IProductContent | null;
  currentAnalysis: IContentAnalysis | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBarcode: (barcode: string | null) => void;
  setProduct: (product: IProduct | null) => void;
  setContent: (content: IProductContent | null) => void;
  setAnalysis: (analysis: IContentAnalysis | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  // Initial state
  currentBarcode: null,
  currentProduct: null,
  currentContent: null,
  currentAnalysis: null,
  isLoading: false,
  error: null,

  // Actions
  setBarcode: (barcode) => set({ currentBarcode: barcode }),
  setProduct: (product) => set({ currentProduct: product }),
  setContent: (content) => set({ currentContent: content }),
  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentBarcode: null,
      currentProduct: null,
      currentContent: null,
      currentAnalysis: null,
      isLoading: false,
      error: null,
    }),
}));
