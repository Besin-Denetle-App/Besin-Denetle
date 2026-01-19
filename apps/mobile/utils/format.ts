/**
 * Tarihi formatla
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Kısa tarih formatı
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Sayıyı formatla (binlik ayraç)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("tr-TR");
}

/**
 * Gramajı formatla
 */
export function formatQuantity(quantity: string | null | undefined): string {
  if (!quantity) return "";
  // Formatlıysa olduğu gibi döndür
  if (quantity.match(/\d+\s*(g|kg|ml|l|L)/i)) {
    return quantity;
  }
  return quantity;
}

/**
 * Besin değerini formatla
 */
export function formatNutritionValue(
  value: number | null | undefined,
  unit: string = "g",
): string {
  if (value === null || value === undefined) return "-";
  return `${value} ${unit}`;
}

/**
 * Barkodu formatla (gösterim için)
 */
export function formatBarcode(barcode: string): string {
  // EAN-13: XXXX XXXX XXXXX
  if (barcode.length === 13) {
    return `${barcode.slice(0, 4)} ${barcode.slice(4, 8)} ${barcode.slice(8)}`;
  }
  return barcode;
}
