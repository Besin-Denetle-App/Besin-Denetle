# Besin Denetle - Mobil Uygulama

![Version](https://img.shields.io/badge/version-0.7.0-blue.svg)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020.svg)
![React Native](https://img.shields.io/badge/React_Native-0.81-61dafb.svg)
![Platform](https://img.shields.io/badge/Platform-Android-6f42c1.svg)
![Platform](https://img.shields.io/badge/Platform-iOS-202020.svg)

**Besin Denetle Mobile**, kullanıcıların ürünlerle etkileşime geçtiği arayüzdür. Barkod okuma, sonuçları görüntüleme ve oylama işlemleri burada yapılır.

**React Native** ve **Expo** altyapısı kullanılarak geliştirilmiştir. Tasarım için **Tailwind CSS (NativeWind)** tercih edilmiştir.

## 📑 İçindekiler
- [Besin Denetle - Mobil Uygulama](#besin-denetle---mobil-uygulama)
  - [📑 İçindekiler](#-i̇çindekiler)
  - [📸 Ekran Görüntüleri](#-ekran-görüntüleri)
  - [📱 Uygulama Akışı (Kullanıcı Deneyimi)](#-uygulama-akışı-kullanıcı-deneyimi)
  - [🛠️ Kurulum ve Geliştirme](#️-kurulum-ve-geliştirme)
  - [📦 Build ve Yayınlama (EAS Build)](#-build-ve-yayınlama-eas-build)
  - [🏗️ Proje Yapısı](#️-proje-yapısı)
  - [⚠️ Karşılaşılabilecek Sorunlar](#️-karşılaşılabilecek-sorunlar)
  - [🔗 İlgili Dökümanlar](#-i̇lgili-dökümanlar)

---

## 📸 Ekran Görüntüleri

| Ana Sayfa (Kamera) | Sonuç Pop-up | Detay Sayfası |
|:---:|:---:|:---:|
| ![Home](./assets/screenshots/home.png) | ![Popup](./assets/screenshots/popup.png) | ![Detail](./assets/screenshots/detail.png) |

---

## 📱 Uygulama Akışı (Kullanıcı Deneyimi)

Uygulama, kullanıcı dostu ve hızlı bir deneyim sunmak için tasarlanmıştır.

### 1. Barkod Tarama (Ana Sayfa)
Uygulama açıldığında doğrudan kamera arayüzü ile başlar. Kullanıcı markette gezerken hızlıca barkodu taratabilir.

### 2. Sonuç Ekranı (Pop-up)
Tarama sonrası iki durum oluşur:
*   **Ürün Var:** Anında ürün adı, markası ve gramajı gösterilir.
*   **Ürün Yok:** Yapay Zeka (AI) devreye girer, web araması yapar ve yeni ürün kaydını oluşturur.

### 3. Detay Sayfası
Kullanıcı ürünü doğruladığında ("Evet, bu ürün" dediğinde) detay sayfası açılır:
*   **İçindekiler:** Ürünün bileşenleri ve alerjen uyarıları.
*   **Sağlık Analizi:** AI tarafından ürünün sağlığa etkileri yorumlanır.

---

## 🛠️ Kurulum ve Geliştirme

### Gereksinimler
*   Telefonunuzda **Expo Go** uygulaması (App Store / Play Store'dan indirin).
*   Bilgisayarınızda Node.js ve PNPM kurulu olmalı.

### 1. Bağımlılıkları Yükleyin
```bash
pnpm install
```

### 2. Environment Variables
```bash
cp .env.example .env
# .env dosyasını kendi değerlerinizle düzenleyin
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
pnpm start
```
Terminalde çıkan **QR Kodunu** Expo Go uygulaması ile taratın.

---

## 📦 Build ve Yayınlama (EAS Build)

Expo Application Services (EAS) kullanarak bulutta build alınır.

### 1. Kurulum
```bash
npm install -g eas-cli
eas login
```

### 2. EAS Secrets Ayarlama

Build sırasında kullanılacak environment değişkenleri EAS Secrets'ta tutulur.

**Preview Build için:**
```bash
eas env:create --name API_HOST --value "IP_ADRESI" --type string --visibility secret --environment preview
eas env:create --name API_PORT --value "3200" --type string --visibility secret --environment preview
eas env:create --name GOOGLE_WEB_CLIENT_ID --value "XXX" --type string --visibility secret --environment preview
eas env:create --name GOOGLE_ANDROID_CLIENT_ID --value "XXX" --type string --visibility secret --environment preview
eas env:create --name GOOGLE_IOS_CLIENT_ID --value "XXX" --type string --visibility secret --environment preview
```

**Production Build için:**
```bash
eas env:create --name API_URL --value "https://api.besindenetle.app/api" --type string --visibility secret --environment production
eas env:create --name GOOGLE_WEB_CLIENT_ID --value "XXX" --type string --visibility secret --environment production
eas env:create --name GOOGLE_ANDROID_CLIENT_ID --value "XXX" --type string --visibility secret --environment production
eas env:create --name GOOGLE_IOS_CLIENT_ID --value "XXX" --type string --visibility secret --environment production
```

**Secrets'ları listele:**
```bash
eas env:list
```

### 3. Build Alma
```bash
# Preview APK (test için)
eas build -p android --profile preview

# Production AAB (Play Store için)
eas build -p android --profile production
```

### 4. Local Build (WSL2)

Bulut yerine kendi bilgisayarınızda build almak için:

👉 **[WSL2 Mobile Build Rehberi](../../docs/wsl2-mobile-build-guide.md)**

```bash
# WSL2 Ubuntu'da
eas build --local --platform android
```

---

## 🏗️ Proje Yapısı

```text
apps/mobile/
├── app/            # 📱 Ekranlar (Expo Router)
├── assets/         # 🖼️ Görseller
├── components/     # 🧩 UI Bileşenleri
├── constants/      # 📌 Sabit Değerler
├── hooks/          # 🎣 Custom Hooks
├── services/       # 🔌 API Servisleri
├── stores/         # 📦 State Management (Zustand)
├── types/          # 🧱 Tip Tanımları
└── utils/          # 🛠️ Yardımcı Fonksiyonlar
```

---

## ⚠️ Karşılaşılabilecek Sorunlar

**Soru: Kamera açılmıyor.**
*   Cevap: Telefon ayarlarından Expo Go'ya kamera izni verin.

**Soru: "Network Request Failed" hatası.**
*   Cevap: Telefon ve bilgisayarın aynı Wi-Fi'da olduğundan emin olun. `.env`'de doğru IP adresini yazdığınızı kontrol edin.

---

## 🔗 İlgili Dökümanlar

*   📱 [Local Build - EAS (Linux/WSL2)](../../docs/local-build-linux-eas.md) - EAS Local Build
*   🪟 [Local Build - Expo Prebuild (Windows)](../../docs/local-build-windows-native.md) - Expo Prebuild
*   🐳 [Docker Development Rehberi](../../docs/docker-development.md)
*   📦 [Shared Paket](../../packages/shared/README.md)
