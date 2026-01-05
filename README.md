# Besin Denetle 🍎

Besin Denetle, tüketicilerin market alışverişlerinde ürünlerin içeriklerini, besin değerlerini ve sağlık üzerindeki etkilerini şeffaf bir şekilde görmelerini sağlayan, Yapay Zeka (AI) destekli bir mobil platformdur.

## 🌟 Özellikler

- **Barkod Tarama:** Ürün barkodlarını tarayarak anında detaylı bilgiye ulaşın.
- **Yapay Zeka Analizi:** Veritabanında olmayan ürünler için AI (Google Gemini) anlık web araması yapar ve besin değerlerini analiz eder.
- **Sağlık Puanlaması:** Ürünlerin içeriklerine göre otomatik sağlık skoru ve tüketim önerileri.
- **Topluluk Odaklı Doğrulama:** Kullanıcı oylarıyla en doğru ürün verisinin hayatta kalması (Survival of the Fittest).
- **Detaylı İçerik:** Alerjen uyarıları, besin değeri tabloları ve zararlı bileşen analizleri.

## 🏗️ Proje Mimarisi

Bu proje, **PNPM Workspaces** kullanılarak yönetilen bir Monorepo yapısına sahiptir.

```
besin-denetle/
├── apps/
│   ├── backend/    # NestJS tabanlı REST API
│   └── mobile/     # React Native (Expo) mobil uygulaması
│
└── packages/
    └── shared/     # Ortak TypeScript tipleri, DTO'lar ve utility fonksiyonları
```

## 🚀 Başlangıç

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz.

### Gereksinimler

- **Node.js**: v18 veya üzeri
- **PNPM**: v8 veya üzeri (`npm install -g pnpm`)
- **Docker**: PostgreSQL veritabanını çalıştırmak için
- **Expo Go**: Mobil uygulamayı test etmek için (iOS/Android)

### Kurulum

1. **Projeyi Klonlayın**
   ```bash
   git clone https://github.com/Furkan-Pasa/Besin-Denetle.git
   cd Besin-Denetle
   ```

2. **Bağımlılıkları Yükleyin**
   ```bash
   pnpm install
   ```
   > Monorepo yapısı sayesinde tüm projelerin bağımlılıkları tek komutla yüklenir.

3. **Veritabanını Başlatın**
   ```bash
   docker-compose up -d
   ```
   > Docker kurulu değilse, yerel bir PostgreSQL sunucusu kurup `.env` dosyasındaki bağlantı bilgilerini güncelleyebilirsiniz.

### Uygulamaları Çalıştırma

**Backend'i Başlatma:**

```bash
pnpm backend
# Veya detaylı log görmek için:
cd apps/backend && pnpm dev
```

**Mobil Uygulamayı Başlatma:**

```bash
pnpm mobile
# Veya:
cd apps/mobile && pnpm start
```

## 🛠️ Teknoloji Yığını

- **Mobile:** React Native, Expo, NativeWind (Tailwind CSS)
- **Backend:** NestJS, TypeScript, TypeORM
- **Database:** PostgreSQL (JSONB desteği ile)
- **AI:** Google Gemini API (Search Grounding)

## 📦 Paket Yönetimi

Workspace içindeki paketlere bağımlılık eklemek için filter komutunu kullanabilirsiniz:

```bash
# Mobile uygulamasına paket ekleme
pnpm --filter @besin-denetle/mobile add packet-name

# Backend uygulamasına paket ekleme
pnpm --filter @besin-denetle/backend add packet-name
```

## 📚 Dokümantasyon

Daha detaylı bilgi için alt proje dokümanlarını inceleyebilirsiniz:

- [Mobile README](./apps/mobile/README.md)
- [Backend README](./apps/backend/README.md)
- [Shared Package README](./packages/shared/README.md)

## 📄 Lisans

GPL-3.0
