# Besin Denetle - Mobil Uygulama

![Expo](https://img.shields.io/badge/Expo-SDK_54-000020.svg)
![Router](https://img.shields.io/badge/Router-Expo_Router-black)
![React Native](https://img.shields.io/badge/React_Native-0.81-61dafb.svg)
![Style](https://img.shields.io/badge/Style-NativeWind-38bdf8)
![Platform](https://img.shields.io/badge/Platform-Android-6f42c1.svg)
![Platform](https://img.shields.io/badge/Platform-iOS-202020.svg)

**Besin Denetle Mobile**, kullanıcıların ürünlerle etkileşime geçtiği arayüzdür. Barkod okuma, sonuçları görüntüleme ve oylama işlemleri burada yapılır.

**React Native** ve **Expo** altyapısı kullanılarak geliştirilmiştir. Tasarım için **Tailwind CSS (NativeWind)** tercih edilmiştir.

## 📑 İçindekiler

- [Besin Denetle - Mobil Uygulama](#besin-denetle---mobil-uygulama)
  - [📑 İçindekiler](#-i̇çindekiler)
  - [📸 Ekran Görüntüleri](#-ekran-görüntüleri)
  - [📱 Uygulama Akışı (Kullanıcı Deneyimi)](#-uygulama-akışı-kullanıcı-deneyimi)
  - [🛠️ Hızlı Başlangıç (Geliştirme)](#️-hızlı-başlangıç-geliştirme)
  - [📦 Build Seçenekleri](#-build-seçenekleri)
    - [1. EAS Cloud Build (Önerilen)](#1-eas-cloud-build-önerilen)
    - [2. Local Build](#2-local-build)
  - [🔑 İmzalama ve Credentials](#-i̇mzalama-ve-credentials)
  - [🏗️ Proje Yapısı](#️-proje-yapısı)
  - [⚠️ Karşılaşılabilecek Sorunlar](#️-karşılaşılabilecek-sorunlar)
  - [🔗 İlgili Dökümanlar](#-i̇lgili-dökümanlar)

---

## 📸 Ekran Görüntüleri

|           Ana Sayfa (Kamera)           |               Sonuç Pop-up               |               Detay Sayfası                |
| :------------------------------------: | :--------------------------------------: | :----------------------------------------: |
| ![Home](./assets/screenshots/home.png) | ![Popup](./assets/screenshots/popup.png) | ![Detail](./assets/screenshots/detail.png) |

---

## 📱 Uygulama Akışı (Kullanıcı Deneyimi)

Uygulama, kullanıcı dostu ve hızlı bir deneyim sunmak için tasarlanmıştır.

### 1. Barkod Tarama (Ana Sayfa)

Uygulama açıldığında doğrudan kamera arayüzü ile başlar. Kullanıcı markette gezerken hızlıca barkodu taratabilir.

### 2. Sonuç Ekranı (Pop-up)

Tarama sonrası iki durum oluşur:

- **Ürün Var:** Anında ürün adı, markası ve gramajı gösterilir.
- **Ürün Yok:** Yapay Zeka (AI) devreye girer, web araması yapar ve yeni ürün kaydını oluşturur.

### 3. Detay Sayfası

Kullanıcı ürünü doğruladığında ("Evet, bu ürün" dediğinde) detay sayfası açılır:

- **İçindekiler:** Ürünün bileşenleri ve alerjen uyarıları.
- **Sağlık Analizi:** AI tarafından ürünün sağlığa etkileri yorumlanır.

---

## 🛠️ Hızlı Başlangıç (Geliştirme)

Projeyi yerel ortamınızda geliştirme modunda çalıştırmak için:

### Gereksinimler

- Telefonunuzda **Expo Go** uygulaması (App Store / Play Store'dan indirin).
- Bilgisayarınızda Node.js ve PNPM kurulu olmalı.

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

## 📦 Build Seçenekleri

Uygulamayı mağazalara göndermek veya APK/AAB dosyası oluşturmak için iki ana yöntem vardır:

### 1. EAS Cloud Build (Önerilen)

Expo sunucularını kullanarak bulutta build alır. Bilgisayarınızın gücünden bağımsızdır ve en kolay yöntemdir.

**Kurulum:**
```bash
npm install -g eas-cli
eas login
```

**Environment Variables (EAS Secrets):**
```bash
# Production için
eas env:create --name API_URL --value "https://besindenetle.furkanpasa.com/" --type string --visibility secret --environment production
```

**Build Alma:**
```bash
# Preview APK (Test)
eas build -p android --profile preview

# Production AAB (Play Store)
eas build -p android --profile production
```

### 2. Local Build

Kendi bilgisayarınızda build almak için işletim sisteminize uygun rehberi takip edin:

*   🐧 **Linux / WSL2 (EAS Local):**
    👉 **[WSL2 Mobile Build Rehberi](../../docs/mobile-local-build-linux-eas.md)**
    *(Önerilen Local Yöntem)*

*   🪟 **Windows Native (Gradle):**
    👉 **[Windows Native Build Rehberi](../../docs/mobile-local-build-windows-native.md)**
    *(Expo Prebuild ve Gradle kullanarak)*

---

## 🔑 İmzalama ve Credentials

Production build alırken Google Login gibi servislerin çalışması için uygulamanın doğru keystore ile imzalanması gerekir.

### Credentials.json Nedir?
Local build (özellikle Linux/WSL) alırken EAS CLI'nin keystore'a erişmesi için gereken dosyadır.

**Nasıl Ayarlanır (Sadece Local Build İçin):**

1.  Expo'dan keystore'u indirin: `eas credentials`
2.  `.jks` dosyasını `apps/mobile/.credentials/` klasörüne taşıyın.
3.  `apps/mobile/credentials.json` dosyasını oluşturun:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "./.credentials/YOUR_FILENAME.jks",
      "keystorePassword": "...",
      "keyAlias": "...",
      "keyPassword": "..."
    }
  }
}
```

> ⚠️ **Güvenlik Uyarısı:** `.credentials` klasörü ve `credentials.json` dosyası `.gitignore` ile gizlenmiştir. **Asla repoya yüklemeyin!**

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
- Cevap: Telefon ayarlarından Expo Go'ya kamera izni verin.

**Soru: "Network Request Failed" hatası.**
- Cevap: Telefon ve bilgisayarın aynı Wi-Fi'da olduğundan emin olun. `.env`'de doğru IP adresini yazdığınızı kontrol edin.

---

## 🔗 İlgili Dökümanlar

- 📱 [EAS Local Build (Linux/WSL2)](../../docs/mobile-local-build-linux-eas.md)
- 🪟 [Windows Native Build](../../docs/mobile-local-build-windows-native.md)
- 🐳 [Docker Development Rehberi](../../docs/docker-development.md)
- 📦 [Shared Paket](../../packages/shared/README.md)
