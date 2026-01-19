import type {
  IContentAnalysis,
  IProduct,
  IProductContent,
} from "@besin-denetle/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { APP_CONFIG } from "../constants";
import { deleteImage, downloadImage } from "../utils/storage";

// Config'den sabitleri al
const HISTORY_KEY = APP_CONFIG.storageKeys.scanHistory;
const MAX_HISTORY_DAYS = APP_CONFIG.history.maxDays;
const MAX_HISTORY_COUNT = APP_CONFIG.history.maxCount;

/**
 * Geçmiş kaydı tipi
 * productId bazlı, aynı barkod farklı varyantlar ayrı kayıt.
 */
export interface HistoryItem {
  id: string; // productId - benzersiz tanımlayıcı
  barcode: string; // Barkod numarası
  product: IProduct; // Ürün bilgileri
  content: IProductContent | null; // Son içerik
  analysis: IContentAnalysis | null; // Son analiz
  viewedAt: string; // ISO tarih
  localImagePath?: string; // Offline resim yolu
}

interface HistoryState {
  // State
  history: HistoryItem[];
  isLoading: boolean;

  // Actions
  loadHistory: () => Promise<void>;
  addToHistory: (
    item: Omit<HistoryItem, "viewedAt" | "localImagePath">,
  ) => Promise<void>;
  updateHistoryAnalysis: (
    productId: string,
    analysis: IContentAnalysis,
  ) => Promise<void>;
  clearHistory: () => Promise<void>;
  cleanOldRecords: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],
  isLoading: true,

  // Geçmişi yükle
  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) {
        const history: HistoryItem[] = JSON.parse(data);
        // Eski kayıtları filtrele
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);

        const filteredHistory: HistoryItem[] = [];
        const deletedItems: HistoryItem[] = [];

        for (const item of history) {
          if (new Date(item.viewedAt) > cutoffDate) {
            filteredHistory.push(item);
          } else {
            deletedItems.push(item);
          }
        }

        // Silinen kayıtların resimlerini temizle
        for (const item of deletedItems) {
          await deleteImage(item.localImagePath);
        }

        set({ history: filteredHistory });

        // Temizlenen listeyi persist et
        if (filteredHistory.length !== history.length) {
          await AsyncStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(filteredHistory),
          );
        }
      }
    } catch (error) {
      console.error("History load error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Geçmişe ekle (resim arka planda indirilir)
  addToHistory: async (item) => {
    try {
      const { history } = get();

      // Önce resimsiz kaydet
      const newItem: HistoryItem = {
        ...item,
        viewedAt: new Date().toISOString(),
        localImagePath: undefined, // Resim henüz yok
      };

      // productId bazlı kontrol: aynı ürün varsa güncelle, yoksa yeni ekle
      const existingIndex = history.findIndex((h) => h.id === item.id);
      let newHistory: HistoryItem[];
      let oldImagePath: string | undefined;

      if (existingIndex >= 0) {
        // Eski resim yolunu tut
        oldImagePath = history[existingIndex].localImagePath;

        // Mevcut kaydı güncelle ve başa taşı (en son görülen üstüne gelsin)
        newHistory = [
          newItem,
          ...history.slice(0, existingIndex),
          ...history.slice(existingIndex + 1),
        ];
      } else {
        // Yeni kayıt ekle
        newHistory = [newItem, ...history];
      }

      // Maksimum 200 kayıt tut
      let deletedItems: HistoryItem[] = [];
      if (newHistory.length > MAX_HISTORY_COUNT) {
        deletedItems = newHistory.slice(MAX_HISTORY_COUNT);
        newHistory = newHistory.slice(0, MAX_HISTORY_COUNT);
      }

      // State'i güncelle ve kaydet
      set({ history: newHistory });
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

      // Arka planda resim indir
      const productId = item.id;
      const imageUrl = item.product.image_url;

      // Fire and forget
      (async () => {
        try {
          // Eski resmi sil (varsa)
          if (oldImagePath) {
            await deleteImage(oldImagePath);
          }

          // Silinen kayıtların resimlerini sil
          for (const deletedItem of deletedItems) {
            await deleteImage(deletedItem.localImagePath);
          }

          // Yeni resmi indir
          const localImagePath = await downloadImage(imageUrl, productId);

          if (localImagePath) {
            // Store ve AsyncStorage güncelle
            const { history: currentHistory } = get();
            const updatedHistory = currentHistory.map((h) =>
              h.id === productId ? { ...h, localImagePath } : h,
            );
            set({ history: updatedHistory });
            await AsyncStorage.setItem(
              HISTORY_KEY,
              JSON.stringify(updatedHistory),
            );
          }
        } catch (err) {
          console.warn("[HistoryStore] Background image task failed:", err);
        }
      })();
    } catch (error) {
      console.error("History add error:", error);
    }
  },

  // Analiz güncelle
  updateHistoryAnalysis: async (productId, analysis) => {
    try {
      const { history } = get();
      const updatedHistory = history.map((item) =>
        item.id === productId ? { ...item, analysis } : item,
      );
      set({ history: updatedHistory });
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("History analysis update error:", error);
    }
  },

  // Geçmişi temizle
  clearHistory: async () => {
    try {
      const { history } = get();

      // Tüm resimleri sil
      for (const item of history) {
        await deleteImage(item.localImagePath);
      }

      await AsyncStorage.removeItem(HISTORY_KEY);
      set({ history: [] });
    } catch (error) {
      console.error("History clear error:", error);
    }
  },

  // Eski kayıtları temizle
  cleanOldRecords: async () => {
    try {
      const { history } = get();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);

      const filteredHistory: HistoryItem[] = [];
      const deletedItems: HistoryItem[] = [];

      for (const item of history) {
        if (new Date(item.viewedAt) > cutoffDate) {
          filteredHistory.push(item);
        } else {
          deletedItems.push(item);
        }
      }

      // Silinen kayıtların resimlerini sil
      for (const item of deletedItems) {
        await deleteImage(item.localImagePath);
      }

      if (filteredHistory.length !== history.length) {
        set({ history: filteredHistory });
        await AsyncStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(filteredHistory),
        );
      }
    } catch (error) {
      console.error("History clean error:", error);
    }
  },
}));
