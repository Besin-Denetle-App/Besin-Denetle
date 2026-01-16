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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

const STORAGE_KEY = '@haptic_enabled';

interface HapticsState {
  enabled: boolean;
  isLoading: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  
  // Impact Feedback - Farklı yoğunluklar
  selection: () => Promise<void>;  // 🔹 En hafif - tab, scroll
  light: () => Promise<void>;      // 🔸 Hafif - genel butonlar
  medium: () => Promise<void>;     // 🔸🔸 Orta - önemli aksiyonlar
  heavy: () => Promise<void>;      // 🔸🔸🔸 Sert - kritik aksiyonlar
  
  // Notification Feedback - Durum bildirimleri
  success: () => Promise<void>;    // ✅ Başarı
  error: () => Promise<void>;      // ❌ Hata
}

export const useHapticsStore = create<HapticsState>((set, get) => ({
  enabled: true, // Varsayılan: açık
  isLoading: true,

  // Uygulama başlangıcında ayarı yükle
  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        set({ enabled: saved === 'true' });
      }
    } catch (error) {
      console.error('Haptics initialize error:', error);
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
      console.error('Haptics save error:', error);
    }
  },

  // 🔹 Selection - En hafif (tab değiştirme, scroll)
  selection: async () => {
    const { enabled } = get();
    if (!enabled) return;
    
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // 🔸 Light - Hafif (genel butonlar)
  light: async () => {
    const { enabled } = get();
    if (!enabled) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // 🔸🔸 Medium - Orta (önemli aksiyonlar)
  medium: async () => {
    const { enabled } = get();
    if (!enabled) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // 🔸🔸🔸 Heavy - Sert (kritik aksiyonlar)
  heavy: async () => {
    const { enabled } = get();
    if (!enabled) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // ✅ Success - Başarı bildirimi
  success: async () => {
    const { enabled } = get();
    if (!enabled) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics desteklenmiyor
    }
  },

  // ❌ Error - Hata bildirimi
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
