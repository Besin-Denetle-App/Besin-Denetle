import type { IContentAnalysis, IProduct, IProductContent } from '@besin-denetle/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { APP_CONFIG } from '../constants';
import { deleteImage, downloadImage } from '../utils/storage';

// Sabitleri constants'tan al
const HISTORY_KEY = APP_CONFIG.storageKeys.scanHistory;
const MAX_HISTORY_DAYS = APP_CONFIG.history.maxDays;
const MAX_HISTORY_COUNT = APP_CONFIG.history.maxCount;

// Geçmiş kaydı tipi
export interface HistoryItem {
  id: string; // productId
  barcode: string;
  product: IProduct;
  content: IProductContent | null;
  analysis: IContentAnalysis | null;
  viewedAt: string; // ISO date string
  localImagePath?: string; // Telefona indirilmiş resim yolu
}

interface HistoryState {
  // State
  history: HistoryItem[];
  isLoading: boolean;

  // Actions
  loadHistory: () => Promise<void>;
  addToHistory: (item: Omit<HistoryItem, 'viewedAt' | 'localImagePath'>) => Promise<void>;
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
        // 40 günden eski kayıtları filtrele
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

        // Silinen kayıtların local resimlerini temizle
        for (const item of deletedItems) {
          await deleteImage(item.localImagePath);
        }

        set({ history: filteredHistory });
        
        // Temizlenen listeyi kaydet
        if (filteredHistory.length !== history.length) {
          await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
        }
      }
    } catch (error) {
      console.error('History load error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Geçmişe ekle
  addToHistory: async (item) => {
    try {
      const { history } = get();

      // Resmi indir
      const localImagePath = await downloadImage(item.product.image_url, item.id);

      const newItem: HistoryItem = {
        ...item,
        viewedAt: new Date().toISOString(),
        localImagePath,
      };

      // Aynı ürün varsa güncelle, yoksa başa ekle
      const existingIndex = history.findIndex((h) => h.id === item.id);
      let newHistory: HistoryItem[];

      if (existingIndex >= 0) {
        // Eski local resmi sil (yeni indirilmişse)
        const oldItem = history[existingIndex];
        if (oldItem.localImagePath && oldItem.localImagePath !== localImagePath) {
          await deleteImage(oldItem.localImagePath);
        }
        
        // Mevcut kaydı güncelle ve başa taşı
        newHistory = [
          newItem,
          ...history.slice(0, existingIndex),
          ...history.slice(existingIndex + 1),
        ];
      } else {
        // Yeni kayıt ekle
        newHistory = [newItem, ...history];
      }

      // Maksimum 200 kayıt tut, fazlasının resimlerini sil
      if (newHistory.length > MAX_HISTORY_COUNT) {
        const deletedItems = newHistory.slice(MAX_HISTORY_COUNT);
        for (const deletedItem of deletedItems) {
          await deleteImage(deletedItem.localImagePath);
        }
        newHistory = newHistory.slice(0, MAX_HISTORY_COUNT);
      }

      set({ history: newHistory });
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('History add error:', error);
    }
  },

  // Geçmişi temizle
  clearHistory: async () => {
    try {
      const { history } = get();
      
      // Tüm local resimleri sil
      for (const item of history) {
        await deleteImage(item.localImagePath);
      }
      
      await AsyncStorage.removeItem(HISTORY_KEY);
      set({ history: [] });
    } catch (error) {
      console.error('History clear error:', error);
    }
  },

  // Eski kayıtları temizle (40 günden eski)
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

      // Silinen kayıtların local resimlerini temizle
      for (const item of deletedItems) {
        await deleteImage(item.localImagePath);
      }

      if (filteredHistory.length !== history.length) {
        set({ history: filteredHistory });
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
      }
    } catch (error) {
      console.error('History clean error:', error);
    }
  },
}));
