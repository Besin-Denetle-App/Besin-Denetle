# Besin Denetle 🍎

Barkod okuma ve besin değeri analizi yapan mobil uygulama ve backend API.

## 📁 Monorepo Yapısı

Bu proje pnpm workspaces kullanılarak organize edilmiş bir monorepo'dur:

```
apps/
  ├── mobile/     # React Native (Expo) mobil uygulaması
  └── backend/    # Backend API

packages/
  └── shared/     # Ortak tipler ve utility'ler
```

## 🚀 Başlangıç

### Gereksinimler

- Node.js >= 18
- pnpm >= 8

```bash
# pnpm kur (eğer yoksa)
npm install -g pnpm

# Tüm bağımlılıkları yükle
pnpm install
```

### Mobil Uygulamayı Çalıştırma

```bash
# Development server başlat
pnpm mobile

# Android'de çalıştır
pnpm mobile:android

# iOS'ta çalıştır (macOS gerekli)
pnpm mobile:ios
```

### Backend'i Çalıştırma

```bash
pnpm backend
```

_(Henüz implement edilmedi)_

## 📦 Workspace Komutları

```bash
# Sadece mobile için bağımlılık ekle
pnpm --filter @besin-denetle/mobile add <package>

# Sadece backend için bağımlılık ekle
pnpm --filter @besin-denetle/backend add <package>

# Tüm workspace'leri temizle
pnpm clean
```

## 📚 Daha Fazla Bilgi

- [Mobile App README](./apps/mobile/README.md)
- [Backend README](./apps/backend/README.md)

## 📄 Lisans

GPL-3.0
