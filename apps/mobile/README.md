# Besin Denetle - Mobil Uygulama

Besin Denetle projesinin mobil arayüzü, **React Native** ve **Expo** kullanılarak geliştirilmiştir. Kullanıcı arayüzü tasarımı için **NativeWind** (Tailwind CSS) kullanılmıştır.

## 🛠️ Teknoloji Yığını

- **Framework:** Expo (~52.0)
- **Core:** React Native
- **Styling:** NativeWind v4 (Tailwind CSS)
- **Navigation:** Expo Router
- **Fonts:** Google Fonts (Inter, vb.)

## 📱 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js & PNPM
- Telefonunuzda **Expo Go** uygulaması (App Store / Play Store)
- Veya bilgisayarınızda Android Emulator / iOS Simulator

### Çalıştırma

Geliştirme sunucusunu başlatmak için:

```bash
pnpm start
# veya kök dizinden:
pnpm mobile
```

Komut çalıştıktan sonra çıkan QR kodunu telefonunuzdaki Expo Go uygulaması ile okutarak uygulamayı test edebilirsiniz.

#### Emülatörler için:
- **Android:** `a` tuşuna basın veya `pnpm android` komutunu çalıştırın.
- **iOS (macOS):** `i` tuşuna basın veya `pnpm ios` komutunu çalıştırın.

## 🔧 Yapılandırma

Uygulama varsayılan olarak `localhost:3200` adresindeki backend'e bağlanmaya çalışır. Eğer fiziksel cihazda test ediyorsanız, backend sunucunuzun IP adresini yapılandırmanız gerekebilir.

API URL yapılandırması genellikle `.env` dosyasında veya `constants` klasörü içinde bulunur.

```bash
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3200
```

## 🏗️ Proje Yapısı

- `app/`: Expo Router tabanlı sayfa yapısı
- `components/`: Yeniden kullanılabilir UI bileşenleri
- `assets/`: Görseller ve fontlar
