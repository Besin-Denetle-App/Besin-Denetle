# Local Build - EAS (Linux/WSL2)

![WSL2](https://img.shields.io/badge/WSL2-Ubuntu_22.04-e95420.svg)
![Android SDK](https://img.shields.io/badge/Android_SDK-34-6f42c1.svg)
![Java](https://img.shields.io/badge/Java-JDK_17-007396.svg)

Bu rehber, Windows üzerinde WSL2 Ubuntu kullanarak **EAS Local Build** (`eas build --local`) ile Android APK/AAB oluşturmayı adım adım anlatır.

---

## 📋 Gereksinimler Özeti

| Bileşen | Versiyon | Açıklama |
|---------|----------|----------|
| WSL2 | Ubuntu 22.04+ | Windows Subsystem for Linux |
| Node.js | 20.x LTS | JavaScript runtime |
| pnpm | 9.x | Paket yöneticisi |
| Java JDK | 17 | Android build için |
| Android SDK | 34 | Platform ve build tools |
| EAS CLI | Latest | Expo build aracı |

---

## 🚀 Kurulum Adımları

### 1. WSL2 Ubuntu Kurulumu (Yoksa)

PowerShell'de (Admin olarak):
```powershell
wsl --install -d Ubuntu-22.04
```

Kurulum sonrası Ubuntu'yu başlat ve kullanıcı adı/şifre oluştur.

---

### 2. Sistemi Güncelle

```bash
sudo apt update && sudo apt upgrade -y
```

---

### 3. Temel Bağımlılıkları Kur

```bash
sudo apt install -y curl wget unzip zip git build-essential
```

---

### 4. Java JDK 17 Kurulumu

```bash
# OpenJDK 17 kur
sudo apt install -y openjdk-17-jdk

# Doğrula
java -version
# Çıktı: openjdk version "17.x.x" olmalı
```

---

### 5. Node.js Kurulumu (nvm ile)

```bash
# nvm'i indir ve kur
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Shell'i yeniden yükle
source ~/.bashrc

# Node.js 20 LTS kur
nvm install 20
nvm use 20
nvm alias default 20

# Doğrula
node -v  # v20.x.x
npm -v   # 10.x.x
```

---

### 6. pnpm Kurulumu

```bash
# pnpm'i global olarak kur
npm install -g pnpm

# Doğrula
pnpm -v
```

---

### 7. Android SDK Kurulumu

#### 7.1 SDK Dizinini Oluştur

```bash
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
```

#### 7.2 Command Line Tools İndir

```bash
# En güncel sürümü indir (2024)
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip

# Aç ve düzenle
unzip cmdline-tools.zip
mv cmdline-tools latest
rm cmdline-tools.zip
```

#### 7.3 Ortam Değişkenlerini Ayarla

`~/.bashrc` dosyasının sonuna ekle:

```bash
# Android SDK
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0

# Java
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

Değişiklikleri uygula:
```bash
source ~/.bashrc
```

#### 7.4 SDK Bileşenlerini Kur

```bash
# Lisansları kabul et
yes | sdkmanager --licenses

# Gerekli paketleri kur
sdkmanager "platform-tools"
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
sdkmanager "ndk;26.1.10909125"
```

---

### 8. EAS CLI Kurulumu

```bash
npm install -g eas-cli

# Expo hesabına giriş yap
eas login
```

---

## ✅ Kurulum Doğrulama

Tüm araçların doğru kurulduğunu kontrol et:

```bash
echo "=== Kurulum Durumu ==="
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo "pnpm: $(pnpm -v)"
echo "Java: $(java -version 2>&1 | head -1)"
echo "sdkmanager: $(sdkmanager --version)"
echo "eas-cli: $(eas --version)"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "JAVA_HOME: $JAVA_HOME"
```

---

## 📱 Proje Build Alma

### 1. Projeyi Klonla

```bash
cd ~
git clone https://github.com/Furkan-Pasa/Besin-Denetle.git
cd Besin-Denetle
```

### 2. Bağımlılıkları Yükle

```bash
pnpm install
```

### 3. Mobile Dizinine Geç

```bash
cd apps/mobile
```

### 4. Build Al

```bash
# Android APK (development)
eas build --local --platform android --profile development

# Android APK (preview - test için)
eas build --local --platform android --profile preview

# Android AAB (production - Play Store için)
eas build --local --platform android --profile production
```

> **Not:** İlk build uzun sürebilir (10-30 dk). APK/AAB dosyası `apps/mobile` dizininde oluşur.

---

## 🔧 Troubleshooting

### SDK Bulunamıyor Hatası

```bash
# ANDROID_HOME değişkenini kontrol et
echo $ANDROID_HOME

# Eğer boşsa, ~/.bashrc'yi source et
source ~/.bashrc
```

### Yetki Hatası (Permission Denied)

```bash
# SDK dizinine yazma yetkisi ver
chmod -R 755 ~/android-sdk
```

### Bellek Yetersiz

WSL2'nin bellek limitini artır. Windows'ta `%USERPROFILE%\.wslconfig` dosyası oluştur:

```ini
[wsl2]
memory=8GB
swap=4GB
```

Sonra WSL'i yeniden başlat:
```powershell
wsl --shutdown
```

### Gradle Timeout

```bash
# Gradle cache temizle
rm -rf ~/.gradle/caches
```

---

## 📚 Faydalı Komutlar

| Komut | Açıklama |
|-------|----------|
| `eas build --local -p android` | Android build al |
| `eas build --local -p android --profile preview` | Preview APK |
| `eas build:list` | Önceki buildları listele |
| `eas credentials` | Signing credentials yönetimi |
| `sdkmanager --list` | Kurulu SDK bileşenlerini listele |

---

## 🔗 İlgili Dökümanlar

- [Expo EAS Build Dokümantasyonu](https://docs.expo.dev/build/introduction/)
- [Android SDK Command Line Tools](https://developer.android.com/tools)
- [WSL2 Kurulum Rehberi](https://docs.microsoft.com/en-us/windows/wsl/install)
