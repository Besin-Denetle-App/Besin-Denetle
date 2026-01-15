# Besin Denetle - Backend API

![Version](https://img.shields.io/badge/version-0.7.0-blue.svg)
![NestJS](https://img.shields.io/badge/NestJS-v11-e0234e.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791.svg)

**Besin Denetle Backend**, projenin beynidir. Ürün verilerini yönetir, veritabanı işlemlerini gerçekleştirir ve Google Gemini AI servisi ile iletişim kurarak olmayan ürünleri analiz eder.

**NestJS (v11)** framework'ü ile geliştirilmiş, modüler ve mikroservis mimarisine uygun tasarlanmıştır.

## 📑 İçindekiler
- [Besin Denetle - Backend API](#besin-denetle---backend-api)
  - [📑 İçindekiler](#-i̇çindekiler)
  - [📂 Dosya Yapısı](#-dosya-yapısı)
  - [🏗️ Veritabanı Mimarisi](#️-veritabanı-mimarisi)
  - [🧠 Yapay Zeka (AI) Akışı](#-yapay-zeka-ai-akışı)
  - [⚙️ Kurulum ve Yapılandırma](#️-kurulum-ve-yapılandırma)
  - [🚀 Canlı Ortam (Production) Deployment](#-canlı-ortam-production-deployment)
  - [📡 API Endpointleri](#-api-endpointleri)
  - [🧪 Test](#-test)
  - [🔗 İlgili Dökümanlar](#-i̇lgili-dökümanlar)

---

## 📂 Dosya Yapısı

```text
apps/backend/src/
├── common/         # 🛠️ Interceptor, Filter ve Guard'lar
├── config/         # ⚙️ Env ve konfigürasyon dosyaları
├── entities/       # 🗄️ Veritabanı tablo modelleri (TypeORM)
├── modules/        # 📦 İş mantığı modülleri
│   ├── ai/         # 🤖 Gemini AI servisleri
│   ├── auth/       # 🔐 Kimlik doğrulama (OAuth, JWT)
│   ├── health/     # 💚 Sağlık kontrolü
│   ├── product/    # 📦 Ürün işlemleri
│   ├── tasks/      # ⏰ Zamanlanmış görevler
│   └── vote/       # 👍 Oylama sistemi
├── scripts/        # 📜 Veritabanı seed ve migration scriptleri
├── app.module.ts   # 🌳 Ana modül
└── main.ts         # 🚀 Uygulama giriş noktası
```

## 🏗️ Veritabanı Mimarisi

Sistem, ilişkisel bütünlüğü koruyan **6 ana PostgreSQL tablosundan** oluşur.

| Tablo | Açıklama | İlişki |
|-------|----------|--------|
| `barcode` | Taranmış barkod numaraları (tekil) | → product |
| `product` | Ürün varyantları (ad, marka, gramaj) | → product_content |
| `product_content` | İçindekiler ve besin değerleri | → content_analysis |
| `content_analysis` | AI sağlık yorumu ve puan | - |
| `user` | Kullanıcı bilgileri | → vote |
| `vote` | Ürün oylamaları (up/down) | - |

> **Varyant Sistemi:** AI farklı zamanlarda farklı sonuçlar üretebileceği için, her barkodun altında birden fazla `Product` olabilir. Kullanıcılar oylamalarla en doğru varyantı seçer.

---

## 🧠 Yapay Zeka (AI) Akışı

Google Gemini API (Search Grounding özellikli) kullanılarak 3 aşamalı bir analiz yapılır. Bu akış maliyeti optimize eder ve hızı artırır.

1.  **Kimlik Tespiti (Identity):** Barkod taranır, sadece marka ve ürün adı bulunur. (Hızlı yanıt için)
2.  **İçerik Analizi (Content):** Kullanıcı ürünü onaylarsa, içindekiler ve besin değerleri araştırılır. (OCR/Web Search)
3.  **Sağlık Yorumu (Analysis):** Bulunan içerikler beslenme uzmanı rolüyle analiz edilir ve sağlık puanı verilir.

---

## ⚙️ Kurulum ve Yapılandırma

Backend'i çalıştırmak için `.env` dosyasını oluşturmanız **zorunludur**.

### 1. Ortam Değişkenleri (.env)

`apps/backend` klasöründe `.env` dosyasını oluşturun:

```env
# --- SUNUCU AYARLARI ---
PORT=3200
NODE_ENV=development

# --- VERİTABANI ---
# Docker Compose varsayılan ayarlarıdır
DB_HOST=localhost
DB_PORT=5432
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=besindenetle

# --- GÜVENLİK ---
# JWT token üretimi için güçlü bir şifre belirleyin
JWT_SECRET=super-gizli-anahtar-buraya

# --- GOOGLE OAUTH ---
# Google Cloud Console'dan alınır
GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# --- GOOGLE AI ---
# Boş bırakılırsa Mock Servis çalışır
GEMINI_API_KEY=google-ai-studio-key-buraya

# --- TEST MODU ---
# true yapılırsa OAuth doğrulaması atlanır (sadece geliştirme için)
MOCK_AUTH=false
```

### 2. Veritabanını Başlatma

Ana dizindeki Docker Compose dosyasını kullanın:

```bash
docker compose up -d
```

### 3. Uygulamayı Başlatma

```bash
# Geliştirme modu (Hot reload aktif)
pnpm dev
```

---

## 🚀 Canlı Ortam (Production) Deployment

Production deployment için PM2 kullanılması önerilir.

👉 **[Server Ubuntu Deployment Rehberi](../../docs/server-ubuntu-deployment.md)**

### Alternatif: PM2 ile Çalıştırma

Docker kullanmadan doğrudan çalıştırmak için:

```bash
# 1. Bağımlılıkları yükleyin
pnpm install

# 2. Önce Shared kütüphanesini derleyin
pnpm --filter @besin-denetle/shared build

# 3. Backend uygulamasını derleyin
pnpm build

# 4. PM2 ile servisi başlatın
pm2 start dist/main.js --name "besin-backend"
```

---

## 📡 API Endpointleri

Uygulama çalıştığında Swagger dokümantasyonuna erişebilirsiniz:
👉 **URL:** `http://localhost:3200/api/docs`

### Auth Endpoints

| Metot | Endpoint | Açıklama |
| :--- | :--- | :--- |
| `POST` | `/auth/oauth` | Google/Apple OAuth ile giriş |
| `POST` | `/auth/email-signup` | E-posta ile kayıt/giriş (Beta) |
| `POST` | `/auth/register` | Kayıt tamamla (username seç) |
| `POST` | `/auth/refresh` | Access token yenile |
| `POST` | `/auth/logout` | Çıkış yap |

### Product Endpoints

| Metot | Endpoint | Açıklama |
| :--- | :--- | :--- |
| `POST` | `/products/scan` | Barkod tara (AI tetikler) |
| `POST` | `/products/confirm` | Ürünü onayla, içerik getir |
| `POST` | `/products/reject` | Ürün varyantını reddet |
| `POST` | `/content/reject` | İçerik bilgisini reddet |
| `POST` | `/analysis/reject` | AI analizini reddet |
| `POST` | `/barcodes/flag` | Barkodu yiyecek değil olarak işaretle |

### Health Check

| Metot | Endpoint | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/health` | Sunucu sağlık durumu |


---

## 🛠️ Yardımcı Scriptler

Backend, veritabanı yönetimi için çeşitli CLI scriptleri içerir:

```bash
# Skorları yeniden hesapla (User silinince oluşan tutarsızlıkları düzeltir)
pnpm recalculate-scores

# CSV dosyasını analiz et (import öncesi kontrol)
pnpm analyze-csv

# CSV'den veritabanına toplu veri yükle
pnpm import-csv
```

### ⏰ Otomatik Skor Hesaplama

Sistem her gece **02:00** (Türkiye saati) otomatik olarak tüm skorları yeniden hesaplar:
- `Product`, `ProductContent` ve `ContentAnalysis` tabloları
- `Vote` tablosundaki oylardan güncel skorlar hesaplanır
- User silme sonrası oluşan tutarsızlıklar düzeltilir

> **Not:** Manuel tetikleme için `pnpm recalculate-scores` komutu kullanılabilir.

---

## 🧪 Test

Birim ve entegrasyon testlerini çalıştırmak için:

```bash
# Birim testleri
pnpm test

# Test coverage raporu
pnpm test:cov
```

---

## 🔗 İlgili Dökümanlar

*   🐳 [Docker Development Rehberi](../../docs/docker-development.md)
*   🖥️ [Server Deployment Rehberi](../../docs/server-ubuntu-deployment.md)
*   📦 [Shared Paket](../../packages/shared/README.md)
