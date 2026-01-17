/**
 * Haptics Store - Titreşim Ayarları
 *
 * Çeşitli titreşim türleri:
 * - selection: Çok hafif (tab, scroll)
 * - light: Hafif (genel butonlar)
 * - medium: Orta (önemli aksiyonlar)
 * - heavy: Sert (kritik aksiyonlar)
 * - success: Başarı bildirimi
 * - error: Hata bildirimi
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { create } from "zustand";

const STORAGE_KEY = "@haptic_enabled";

interface HapticsState {
  enabled: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;

  // Impact Feedback - Farklı yoğunluklar
  selection: () => Promise<void>;
  light: () => Promise<void>;
  medium: () => Promise<void>;
  heavy: () => Promise<void>;

  // Notification Feedback - Durum bildirimleri
  success: () => Promise<void>;
  error: () => Promise<void>;
}

export const useHapticsStore = create<HapticsState>((set, get) => ({
  enabled: true, // Varsayılan: açık
  isLoading: true,

  // Uygulama başlangıcında ayarı yükle
  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        set({ enabled: saved === "true" });
      }
    } catch (error) {
      console.error("Haptics initialize error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Titreşimi aç/kapat ve kaydet
  setEnabled: async (enabled: boolean) => {
    set({ enabled });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (error) {
      console.error("Haptics save error:", error);
    }
  },

  // Selection
  selection: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // Light
  light: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // Medium
  medium: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // Heavy
  heavy: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // Success - Başarı bildirimi
  success: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // Error - Hata bildirimi
  error: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics desteklenmiyor
    }
  },
}));
