import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Helper Fonksiyonları
 *
 * Kullanım:
 * - Barkod okunduğunda: lightImpact()
 * - Beğenmedim butonlarında: lightImpact()
 *
 * Tüm titreşimler hafif ve kısa (~10ms)
 */

/**
 * Hafif titreşim - Barkod okuma, buton tıklama
 */
export const lightImpact = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics desteklenmiyor (web, bazı emülatörler)
  }
};

/**
 * Orta titreşim - Önemli eylemler
 */
export const mediumImpact = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics desteklenmiyor
  }
};

/**
 * Seçim titreşimi - UI elementleri arasında geçiş
 */
export const selectionFeedback = async (): Promise<void> => {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics desteklenmiyor
  }
};
