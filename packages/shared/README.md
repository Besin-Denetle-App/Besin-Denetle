# @besin-denetle/shared

Mobile ve Backend arasında paylaşılan ortak tipler, interface'ler ve utility fonksiyonları.

## 📦 İçerik

### Tipler

- **`Barcode`** - Barkod bilgisi (değer, tip, zaman)
- **`BarcodeType`** - Barkod tipleri (`ean13`, `ean8`, `upc_a`, vb.)
- **`Product`** - Ürün bilgisi (barkod, isim, marka, besin değerleri)
- **`NutritionInfo`** - Besin değerleri (kalori, protein, karbonhidrat, yağ)
- **`NutriScore`** - Nutri-Score sınıfı (`A`, `B`, `C`, `D`, `E`)
- **`NutriScoreData`** - Nutri-Score grade ve puan bilgisi
- **`ApiResponse<T>`** - Generic API response tipi
- **`ProductSearchResponse`** - Ürün arama sonucu

### Utility Fonksiyonları

- **`isValidEAN13(barcode: string): boolean`** - EAN-13 barkod validasyonu (checksum kontrolü ile)
- **`isValidBarcode(barcode: string, type?: BarcodeType): boolean`** - Genel barkod validasyonu
- **`calculateNutriScore(nutrition: NutritionInfo): NutriScoreData`** - Nutri-Score hesaplama

## 🚀 Kullanım

### Mobile App'te

```typescript
import {
  Product,
  isValidBarcode,
  calculateNutriScore,
} from "@besin-denetle/shared";

const handleBarcodeScanned = (barcodeValue: string) => {
  // Barkod validasyonu
  if (!isValidBarcode(barcodeValue, "ean13")) {
    alert("Geçersiz barkod!");
    return;
  }

  // Ürün bilgisi
  const product: Product = {
    barcode: barcodeValue,
    name: "Örnek Ürün",
    nutritionInfo: {
      calories: 250,
      protein: 5,
      carbohydrates: 30,
      fat: 10,
    },
  };

  // Nutri-Score hesapla
  if (product.nutritionInfo) {
    const nutriScore = calculateNutriScore(product.nutritionInfo);
    console.log(`Nutri-Score: ${nutriScore.grade}`);
  }
};
```

### Backend'de

```typescript
import { ApiResponse, Product, NutritionInfo } from "@besin-denetle/shared";

app.get("/api/products/:barcode", (req, res) => {
  const response: ApiResponse<Product> = {
    success: true,
    data: {
      barcode: req.params.barcode,
      name: "Ürün Adı",
      brand: "Marka",
      nutritionInfo: {
        calories: 200,
        protein: 8,
        carbohydrates: 25,
        fat: 5,
      },
    },
  };

  res.json(response);
});
```

## 💡 Neden Shared Package?

### Single Source of Truth

Tip tanımları ve iş mantığı bir yerde olur:

- ✅ Değişiklik yapınca her yerde güncellenir
- ✅ Tutarsızlık riski yok
- ✅ API contract'ları garanti altında

### Kod Tekrarını Önler

Aynı kodu mobile ve backend'de yazmaya gerek yok:

- ✅ Validasyon kuralları bir kez yazılır
- ✅ Hesaplama algoritmaları paylaşılır
- ✅ Bakım kolaylığı

### Tip Güvenliği

TypeScript sayesinde compile-time hata kontrolü:

- ✅ Mobile ve backend aynı tipleri kullanır
- ✅ Refactoring güvenli
- ✅ IDE auto-complete çalışır

## 📝 Örnek: EAN-13 Validasyon

```typescript
import { isValidEAN13 } from "@besin-denetle/shared";

// Geçerli barkod (checksum doğru)
isValidEAN13("8690632006314"); // true

// Geçersiz barkod (checksum yanlış)
isValidEAN13("8690632006315"); // false

// Geçersiz format
isValidEAN13("123"); // false
```

## 📊 Nutri-Score Hesaplama

Nutri-Score, ürünlerin besin kalitesini A (en iyi) ile E (en kötü) arasında değerlendirir.

```typescript
import { calculateNutriScore, NutritionInfo } from "@besin-denetle/shared";

const nutrition: NutritionInfo = {
  calories: 500,
  protein: 10,
  carbohydrates: 60,
  sugars: 20,
  fat: 15,
  saturatedFat: 5,
  fiber: 3,
  sodium: 400,
};

const result = calculateNutriScore(nutrition);
console.log(result.grade); // 'C'
console.log(result.score); // 12
```

> **Not:** Bu implementasyon basitleştirilmiştir. Gerçek Nutri-Score algoritması daha karmaşıktır ve ürün kategorisine göre değişir.

## 🔧 Geliştirme

### Build

```bash
cd packages/shared
pnpm build
```

### Type Check

```bash
pnpm tsc --noEmit
```

## 📚 Kaynaklar

- [Nutri-Score Algorithm](https://www.santepubliquefrance.fr/)
- [EAN-13 Barcode](https://en.wikipedia.org/wiki/International_Article_Number)
- [OpenFoodFacts API](https://world.openfoodfacts.org/data)
