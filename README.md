# Besin Denetle Mobil App

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)
![Status](https://img.shields.io/badge/status-Active_Development-orange.svg)
![Tech](https://img.shields.io/badge/tech-React_Native_%7C_NestJS_%7C_PostgreSQL-purple.svg)

**Besin Denetle**, tüketicilerin market alışverişlerinde ürünlerin içeriklerini, besin değerlerini ve sağlık üzerindeki etkilerini şeffaf bir şekilde görmelerini sağlayan, Yapay Zeka (AI) destekli modern bir mobil platformdur.

Bu proje, "Survival of the Fittest" (En Güçlünün Hayatta Kalması) prensibini benimser: Kullanıcı oylarıyla doğrulanan veriler hayatta kalır, hatalı bilgiler elenir.

## 📑 İçindekiler
- [Besin Denetle Mobil App](#besin-denetle-mobil-app)
  - [📑 İçindekiler](#-i̇çindekiler)
  - [🏗️ Sistem Mimarisi](#️-sistem-mimarisi)
    - [📂 Proje Yapısı (Monorepo)](#-proje-yapısı-monorepo)
  - [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
    - [Gereksinimler](#gereksinimler)
    - [Kurulum Adımları](#kurulum-adımları)
  - [🌍 Canlı Ortam (Production) Kurulumu](#-canlı-ortam-production-kurulumu)
  - [📚 Dokümantasyon](#-dokümantasyon)
  - [📄 Lisans](#-lisans)

---

## 🏗️ Sistem Mimarisi

Proje, güvenilirliği ve ölçeklenebilirliği artırmak için modern bir **Monorepo** yapısı üzerine kurulmuştur. Aşağıdaki diyagram, sistemin genel çalışma mantığını özetler:
*(GitHub Mermaid diyagramlarını yerel olarak destekler)*

```mermaid
flowchart TD
    User[📱 Mobil Kullanıcı] -->|Barkod Tarama| App[Besin Denetle App]
    App -->|API İstekleri| Backend[Backend API (NestJS)]
    Backend -->|Veri & İlişki| DB[(PostgreSQL)]
    Backend -->|Web Araması & Analiz| AI[Google Gemini AI]
    
    subgraph "Veri Akışı"
        Backend -- Ürün Bulunamadı --> AI
        AI -- Ürün Bilgisi --> Backend
        Backend -- Doğrulanmış Veri --> App
    end
```

### 📂 Proje Yapısı (Monorepo)

Bu proje **PNPM Workspaces** ile yönetilmektedir.

```text
Besin-Denetle/
├── Apps/
│   ├── mobile/     # 📱 React Native (Expo) Uygulaması
│   └── backend/    # ⚙️ NestJS API Servisi
├── Packages/
│   └── shared/     # 📦 Ortak DTO ve Tip Tanımları
├── docs/           # 📄 Proje Dokümantasyonu
├── docker-compose  # 🐳 Veritabanı Konfigürasyonu
└── README.md       # 🏠 Ana Dokümantasyon
```

*   **`apps/mobile`**: React Native & Expo ile geliştirilmiş mobil uygulama (iOS/Android).
*   **`apps/backend`**: NestJS ile geliştirilmiş REST API servisi.
*   **`packages/shared`**: İki uygulama arasında paylaşılan DTO'lar, Tip Tanımları ve Utility fonksiyonları.

---

## 🚀 Hızlı Başlangıç

Projeyi yerel ortamınızda (Localhost) çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
*   Node.js (v18+)
*   PNPM (`npm install -g pnpm`)
*   Docker (Veritabanı için)

### Kurulum Adımları

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/Furkan-Pasa/Besin-Denetle.git
    cd Besin-Denetle
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    pnpm install
    ```

3.  **Veritabanını Başlatın:**
    Proje kök dizininde Docker Compose'u çalıştırın.
    ```bash
    docker compose up -d
    ```

4.  **Uygulamaları Başlatın:**
    
    **Backend:**
    ```bash
    # Yeni bir terminalde:
    cd apps/backend
    pnpm dev
    ```
    
    **Mobile:**
    ```bash
    # Yeni bir terminalde:
    cd apps/mobile
    pnpm start
    ```

---

## 🌍 Canlı Ortam (Production) Kurulumu

Bu projeyi Ubuntu vb. bir sunucuda yayına almak için hazır bir rehber bulunmaktadır.

*   Backend API'yi PM2 ile çalıştırmak
*   Veritabanı bağlantılarını ayarlamak
*   Build süreçlerini yönetmek

Detaylar için lütfen **[Backend Dokümantasyonu](./apps/backend/README.md)** dosyasını inceleyiniz.

## 📚 Dokümantasyon

Her modülün kendi özel teknik dokümantasyonu mevcuttur:

*   📱 **Mobil Uygulama:** Ekranlar, Navigasyon ve Build işlemleri için → [Mobile README](./apps/mobile/README.md)
*   ⚙️ **Backend API:** Veritabanı Şeması, AI Prompt Mantığı ve API Endpoint'leri için → [Backend README](./apps/backend/README.md)
*   📦 **Shared Kütüphane:** Ortak veri tipleri ve kullanım rehberi için → [Shared README](./packages/shared/README.md)

## 📄 Lisans

GPL-3.0
