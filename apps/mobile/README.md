# Besin Denetle - Mobil Uygulama

**Besin Denetle Mobile**, kullanıcıların ürünlerle etkileşime geçtiği arayüzdür. Barkod okuma, sonuçları görüntüleme ve oylama işlemleri burada yapılır.

**React Native** ve **Expo** altyapısı kullanılarak geliştirilmiştir. Tasarım için **Tailwind CSS (NativeWind)** tercih edilmiştir.

---

## 📸 Ekran Görüntüleri

| Ana Sayfa (Kamera) | Sonuç Pop-up | Detay Sayfası |
|:---:|:---:|:---:|
| ![Home](https://placehold.co/200x400?text=Kamera+Arayuzu) | ![Popup](https://placehold.co/200x400?text=Sonuc+Ekrani) | ![Detail](https://placehold.co/200x400?text=Detay+Sayfasi) |

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
*   **Sağlık Analizi:** AI tarafından ürünün sağlığa etkileri yorumlanır (Örn: "Şeker oranı yüksek, dikkatli tüketin").

---

## 🛠️ Kurulum ve Geliştirme

Yerel ortamınızda projeyi ayağa kaldırmak için aşağıdaki adımları izleyin.

### Gereksinimler
*   Telefonunuzda **Expo Go** uygulaması (App Store / Play Store'dan indirin).
*   Bilgisayarınızda Node.js ve PNPM kurulu olmalı.

### 1. Bağımlılıkları Yükleyin
Tüm proje bağımlılıklarını kurun:
```bash
pnpm install
```

### 2. Yapılandırma
Mobil uygulamanın backend'e ulaşabilmesi için API adresini belirtmelisiniz. Varsayılan olarak localhost'a bakar.
Fiziksel cihaz kullanıyorsanız bilgisayarınızın yerel IP adresini (örn: 192.168.1.x) kullanmalısınız.

`.env` dosyası veya ilgili config dosyasında:
```bash
EXPO_PUBLIC_API_URL=http://<BILGISAYAR_IP_ADRESI>:3200
```

### 3. Başlatma
Geliştirme sunucusunu başlatın:
```bash
pnpm start
# veya özel olarak mobile klasöründe:
cd apps/mobile && pnpm start
```
Terminalde çıkan **QR Kodunu** telefonunuzdaki kamera veya Expo Go uygulaması ile taratın.

---

## 📦 Build ve Yayınlama

Uygulamanın APK (Android) veya IPA (iOS) dosyalarını oluşturmak için iki yöntem vardır.

### A. EAS Build (Bulut - Önerilen)
Expo'nun sunucularında build almak için:

```bash
# EAS CLI kurulumu
npm install -g eas-cli

# Expo hesabına giriş
eas login

# Android APK oluştur
eas build -p android --profile preview
```

### B. Local Build (Prebuild)
Kendi bilgisayarınızda build almak için native klasörleri (`android/` ve `ios/`) oluşturmanız gerekir.

```bash
# Native klasörleri oluştur
pnpm prebuild

# Android Studio ile açıp derleyebilirsiniz
```

---

## 🏗️ Proje Yapısı

Expo Router kullanıldığı için dosya tabanlı yönlendirme (file-based routing) geçerlidir.

```text
apps/mobile/
├── app/            # 📱 Ekranlar ve Sayfalar (Expo Router)
│   ├── (tabs)/     # Alt menü sekmeleri (Tabs)
│   ├── result/     # Sonuç detay sayfaları
│   └── index.tsx   # Giriş sayfası
├── assets/         # 🖼️ Resimler ve Fontlar
├── components/     # 🧩 UI Bileşenleri (Button, Card...)
├── constants/      # ⚙️ Sabitler ve Ayarlar
└── hooks/          # 🎣 Custom React Hooks
```

## ⚠️ Karşılaşılabilecek Sorunlar

**Soru: Kamera açılmıyor.**
*   Cevap: Telefon ayarlarından Expo Go uygulamasına kamera izni verdiğinizden emin olun.

**Soru: "Network Request Failed" hatası alıyorum.**
*   Cevap: Telefonunuz ve bilgisayarınızın **aynı Wi-Fi** ağında olduğundan emin olun. Ayrıca `EXPO_PUBLIC_API_URL` ayarında `localhost` yerine bilgisayarınızın IP adresini (192.168...) yazdığınızı kontrol edin.
