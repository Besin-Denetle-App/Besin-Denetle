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

  // Impact Feedback
  selection: () => Promise<void>;
  light: () => Promise<void>;
  medium: () => Promise<void>;
  heavy: () => Promise<void>;

  // Notification Feedback
  success: () => Promise<void>;
  error: () => Promise<void>;
}

export const useHapticsStore = create<HapticsState>((set, get) => ({
  enabled: true, // Varsayılan açık
  isLoading: true,

  // Başlangıçta ayarı yükle
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

  // Titreşim toggle
  setEnabled: async (enabled: boolean) => {
    set({ enabled });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (error) {
      console.error("Haptics save error:", error);
    }
  },

  // Selection feedback
  selection: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.selectionAsync();
    } catch {
      // Cihaz desteklemiyor
    }
  },

  // Light impact
  light: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Cihaz desteklemiyor
    }
  },

  // Medium impact
  medium: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Cihaz desteklemiyor
    }
  },

  // Heavy impact
  heavy: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Cihaz desteklemiyor
    }
  },

  // Success notification
  success: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Cihaz desteklemiyor
    }
  },

  // Error notification
  error: async () => {
    const { enabled } = get();
    if (!enabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Cihaz desteklemiyor
    }
  },
}));
