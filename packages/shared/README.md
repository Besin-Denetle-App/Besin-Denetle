# @besin-denetle/shared

![Version](https://img.shields.io/badge/version-0.7.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)
![Type](https://img.shields.io/badge/Type-Library-blueviolet.svg)

**Besin Denetle Shared Paketi**, Backend ve Mobil uygulama arasında ortak kullanılan kodları barındıran kritik bir modüldür. "Tek Kaynak, Çok Kullanım" (Single Source of Truth) prensibine dayanır.

Bu kütüphanenin amacı, tip güvenliğini (Type Safety) garanti altına almak ve kod tekrarını önlemektir. Backend'de bir DTO değiştiğinde, Mobil tarafı bunu derleme zamanında (compile-time) fark eder.

---

## 📦 Paket İçeriği

Paket temel olarak üç ana kategoriden oluşur:

### 1. DTOs (Data Transfer Objects)
API endpoint'lerinde gönderilen ve alınan veri şemalarıdır.
*   **Request DTOs:** İstemciden (Mobil) sunucuya giden veriler (Örn: `ScanBarcodeDto`).
*   **Response DTOs:** Sunucudan istemciye dönen veriler (Örn: `ProductResponseDto`).

### 2. Types & Interfaces
Veritabanı modelleri ve genel tip tanımlarıdır.
*   **Entities:** Veritabanı tablolarının TypeScript karşılıkları (Örn: `IProduct`, `IUser`).
*   **Enums:** Sabit değer listeleri (Örn: `UserRole.ADMIN`, `VoteType.UPVOTE`).

### 3. Constants
Uygulama genelinde kullanılan sabit değerler.
*   Regex desenleri, varsayılan yapılandırmalar vb.

---

## 📂 Dosya Yapısı

```text
packages/shared/src/
├── dto/            # 📨 Request/Response DTO'ları
├── types/          # 🧱 Interface ve Enum tanımları
├── constants.ts    # 📌 Sabit değerler
└── index.ts        # 📤 Dışa aktarılan modüller
```

## 🚀 Kullanım Rehberi

Bu paket bir NPM paketi gibi davranır ancak Monorepo içinde yerel olarak bağlanır.

### Backend'de Kullanımı
Backend projesinde bu paketi import ederek kullanabilirsiniz:

```typescript
import { ScanBarcodeDto } from '@besin-denetle/shared';

@Post('scan')
async scanProduct(@Body() body: ScanBarcodeDto) {
  // body'nin tipi otomatik olarak doğrulanır
}
```

### Mobile'de Kullanımı
Mobil uygulamada API istekleri atarken dönüş tiplerini belirlemek için kullanılır:

```typescript
import { ProductResponseDto } from '@besin-denetle/shared';

const response = await axios.get<ProductResponseDto>('/api/products/1');
```

---

## 🔨 Geliştirme ve Derleme

Shared paketinde bir değişiklik yaptığınızda (örneğin yeni bir DTO eklediğinizde), bu değişikliklerin diğer projeler tarafından görülebilmesi için paketin derlenmesi gerekir.

### Derleme Komutu
```bash
# Sadece Shared paketini derle
pnpm build

# Değişiklikleri anlık izle (Geliştirme sırasında önerilir)
pnpm dev
```
`pnpm dev` komutu, `tsc --watch` modunda çalışır ve siz dosyayı kaydettiğiniz anda otomatik derleme yapar.

---

## ⚠️ Geliştirici Kuralları

1.  **İş Mantığı Yok:** Bu pakette asla veritabanı sorgusu, API isteği veya karmaşık iş mantığı bulunmamalıdır. Sadece veri yapıları (Anemic Domain Model) olmalıdır.
2.  **Bağımlılıklar:** Bu paket `backend` veya `mobile` projelerine bağımlı olmamalıdır. Döngüsel bağımlılık (Circular Dependency) yaratmaktan kaçının.
3.  **İsimlendirme:** DTO'lar `Dto` ile, Arayüzler `I` ile başlamalı veya bitmelidir.

---

## 🔗 İlgili Dökümanlar

*   ⚙️ [Backend README](../../apps/backend/README.md)
*   📱 [Mobile README](../../apps/mobile/README.md)
