# Local Build - Expo Prebuild (Windows)

![Windows](https://img.shields.io/badge/Windows-10%2F11-0078d4.svg)
![Android SDK](https://img.shields.io/badge/Android_SDK-34-6f42c1.svg)
![Java](https://img.shields.io/badge/Java-JDK_17-007396.svg)

Bu rehber, Windows üzerinde **Expo Prebuild** kullanarak doğrudan Android APK/AAB oluşturmayı açıklar. WSL veya EAS Cloud gerektirmez.

> **Alternatifler:**
> - EAS Cloud Build (en kolay) → [Mobile README](../apps/mobile/README.md)
> - WSL2 ile EAS Local Build → [WSL2 Build Rehberi](./wsl2-mobile-build-guide.md)

---

## 📋 Gereksinimler

| Bileşen | Versiyon | Açıklama |
|---------|----------|----------|
| Windows | 10/11 | 64-bit |
| Node.js | 20.x LTS | JavaScript runtime |
| pnpm | 9.x | Paket yöneticisi |
| Java JDK | 17 | Android build için |
| Android Studio | Latest | SDK ve araçlar için |

---

## 🚀 Kurulum Adımları

### 1. Java JDK 17 Kurulumu

[Adoptium OpenJDK 17](https://adoptium.net/) indirin ve kurun.

Ortam değişkenlerini ayarlayın (System Properties → Environment Variables):

```
JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
Path += %JAVA_HOME%\bin
```

Doğrulama:
```powershell
java -version
# openjdk version "17.x.x"
```

---

### 2. Android Studio Kurulumu

[Android Studio](https://developer.android.com/studio) indirin ve kurun.

**SDK Manager**'dan şunları yükleyin:
- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android SDK Command-line Tools
- Android SDK Platform-Tools

Ortam değişkenlerini ayarlayın:

```
ANDROID_HOME = C:\Users\<kullanici>\AppData\Local\Android\Sdk
Path += %ANDROID_HOME%\platform-tools
Path += %ANDROID_HOME%\tools
Path += %ANDROID_HOME%\tools\bin
```

Doğrulama:
```powershell
adb --version
# Android Debug Bridge version x.x.x
```

---

### 3. Node.js ve pnpm Kurulumu

[Node.js 20 LTS](https://nodejs.org/) indirin ve kurun.

```powershell
# pnpm kur
npm install -g pnpm

# Doğrula
node -v  # v20.x.x
pnpm -v
```

---

## 📱 Build Alma

### 1. Projeyi Hazırla

```powershell
cd Besin-Denetle
pnpm install
cd apps/mobile
```

### 2. Native Proje Oluştur (Prebuild)

Bu komut `android/` klasörünü oluşturur:

```powershell
npx expo prebuild --platform android
```

> [!TIP]
> **CNG (Continuous Native Generation):** Expo'nun yaklaşımında native kodu Git'te tutmazsın. 
> Her build'de `prebuild` ile yeniden oluşturursun. Bu sayede her zaman güncel ve temiz bir proje elde edersin.

> **Not:** Mevcut `android/` klasörünü temizlemek için `--clean` flag'i ekleyin.

---

### 3. Debug APK Oluşturma (Geliştirme için)

```powershell
# Yöntem 1: Expo CLI ile (önerilen)
npx expo run:android --variant debug

# Yöntem 2: Gradle ile
cd android
./gradlew assembleDebug
```

**Çıktı:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

### 4. Release APK Oluşturma (Dağıtım için)

> [!IMPORTANT]
> Release build için imzalama (signing) gereklidir.

#### 4.1 Keystore Oluşturma

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### 4.2 Gradle Yapılandırması

`android/gradle.properties` dosyasına ekleyin:

```properties
MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

`android/app/build.gradle` dosyasında `signingConfigs` ekleyin:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 4.3 Release Build

```powershell
cd android

# APK için
./gradlew assembleRelease

# AAB için (Play Store)
./gradlew bundleRelease
```

**Çıktılar:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🔑 EAS Credentials ile Uyumluluk

EAS Cloud'da kullandığınız keystore ile local build yapabilirsiniz. Bu sayede aynı imza ile hem cloud hem local build alabilirsiniz.

### EAS'ten Keystore İndirme

```powershell
# Credentials menüsünü aç
eas credentials

# Veya direkt
eas credentials --platform android
```

Menüden:
1. `credentials.json` > `Android` > `production` seç
2. `Download keystore` seç
3. Keystore dosyası (`.jks`) ve metadata indirilir

### Local Build'de Kullanma

İndirdiğin keystore'u `android/app/` klasörüne koy:

```powershell
# İndirilen dosyayı kopyala
copy keystore.jks android/app/upload-keystore.jks
```

`android/gradle.properties` dosyasını güncelle:

```properties
MYAPP_UPLOAD_STORE_FILE=upload-keystore.jks
MYAPP_UPLOAD_KEY_ALIAS=key0
MYAPP_UPLOAD_STORE_PASSWORD=<eas-ten-gelen-sifre>
MYAPP_UPLOAD_KEY_PASSWORD=<eas-ten-gelen-sifre>
```

> [!TIP]
> EAS'ten indirdiğiniz `credentials.json` dosyasında şifreler bulunur.

### EAS Cloud'a Geri Dönme

EAS Cloud build yaparken credentials otomatik kullanılır, ek ayar gerekmez:

```powershell
# Cloud build (keystore EAS'te saklanıyor)
eas build --platform android --profile production
```

> [!NOTE]
> Aynı keystore ile imzalandığı sürece Play Store güncellemeleri sorunsuz çalışır.

---

## 🔧 Troubleshooting

### "SDK location not found" hatası

`android/local.properties` dosyası oluşturun:

```properties
sdk.dir=C:\\Users\\<kullanici>\\AppData\\Local\\Android\\Sdk
```

### "JAVA_HOME is not set" hatası

Ortam değişkenlerini kontrol edin:

```powershell
echo $env:JAVA_HOME
# C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
```

### Gradle sync başarısız

```powershell
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

---

## 📚 Faydalı Komutlar

| Komut | Açıklama |
|-------|----------|
| `npx expo prebuild` | Native proje oluştur |
| `npx expo prebuild --clean` | Temiz prebuild |
| `npx expo run:android` | Debug build ve çalıştır |
| `./gradlew assembleDebug` | Debug APK |
| `./gradlew assembleRelease` | Release APK |
| `./gradlew bundleRelease` | Release AAB |
| `./gradlew clean` | Build cache temizle |

---

## 🔗 İlgili Dökümanlar

- [WSL2 Mobile Build Rehberi](./wsl2-mobile-build-guide.md) - EAS Local Build için
- [Server Ubuntu Deployment Rehberi](./server-ubuntu-deployment.md)
- [Mobile README](../apps/mobile/README.md)
