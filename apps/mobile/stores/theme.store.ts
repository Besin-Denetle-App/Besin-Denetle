/**
 * Theme Store
 * Tercihler: 'system' | 'light' | 'dark'
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "@theme_mode";

interface ThemeState {
  mode: ThemeMode;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system", // Varsayılan cihaz ayarı
  isLoading: true,

  // Uygulama başlangıcında ayarı yükle
  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && ["system", "light", "dark"].includes(saved)) {
        set({ mode: saved as ThemeMode });
      }
    } catch (error) {
      console.error("Theme initialize error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Tema değiştir
  setMode: async (mode: ThemeMode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.error("Theme save error:", error);
    }
  },
}));
