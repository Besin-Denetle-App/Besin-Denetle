# Docker Development Rehberi

![Docker](https://img.shields.io/badge/Docker-24+-2496ed.svg)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2+-2496ed.svg)
![Environment](https://img.shields.io/badge/Environment-Development-yellow.svg)

Bu rehber, Besin-Denetle projesini **local development** ortamında Docker ile nasıl çalıştıracağınızı açıklar.

**Mimari:** Sadece PostgreSQL Docker container'da çalışır. Backend ise doğrudan `pnpm start` ile çalıştırılır.

> **Production deployment için:** [Server Deployment Rehberi](./server-deployment.md)

---

## 📋 Gereksinimler

- Docker Engine 24+
- Docker Compose v2+
- Node.js 20+
- PNPM 8+

---

## 🚀 Hızlı Başlangıç

### 1. Environment Dosyasını Hazırla

Root dizinde `.env` dosyası oluştur:

```bash
cp .env.example .env
```

> [!IMPORTANT]
> En azından `JWT_SECRET` ve `DB_PASSWORD` değerlerini değiştirmeyi unutmayın!

### 2. PostgreSQL'i Başlat

```bash
docker compose up -d db
```

### 3. Backend'i Başlat

```bash
# Bağımlılıkları yükle (ilk kez)
pnpm install

# Shared + Backend'i build et (ilk kez veya değişiklik sonrası)
pnpm build:all

# Backend'i başlat (root dizinden)
pnpm dev:backend
```

### 4. Durumu Kontrol Et

```bash
# PostgreSQL durumu
docker compose ps

# Health check
curl http://localhost:50101/api/health
```

---

## 📦 Kullanım Komutları

### Docker (PostgreSQL)

| Komut | Açıklama |
|-------|----------|
| `docker compose up -d db` | PostgreSQL'i başlat |
| `docker compose down` | PostgreSQL'i durdur |
| `docker compose down -v` | PostgreSQL'i ve verileri sil |
| `docker compose logs -f db` | PostgreSQL logları |
| `docker compose ps` | Servis durumları |

### Backend

| Komut | Açıklama |
|-------|----------|
| `pnpm dev:backend` | Hot reload ile başlat (root) |
| `pnpm build:all` | Shared + Backend build (root) |
| `pnpm start` | Backend'i başlat (apps/backend) |
| `pnpm start:dev` | Hot reload ile başlat (apps/backend) |

---

## 🔧 Servisler

### PostgreSQL (db)

- **Port:** 50103
- **Container:** `besin_denetle_db`
- **Volume:** `postgres_data` (veriler kalıcı)

Veritabanına bağlanmak için:
```bash
docker compose exec db psql -U myuser -d besindenetle
```

### Backend API

- **Port:** 50101 (doğrudan Node.js)
- **Health endpoint:** `http://localhost:50101/api/health`

---

## 🩺 Troubleshooting

### Veritabanı bağlantı hatası

```bash
# Veritabanı durumunu kontrol et
docker compose exec db pg_isready -U myuser

# Container'ı yeniden başlat
docker compose restart db
```

### Shared paketi güncel değil

Backend'de `@besin-denetle/shared` hataları alıyorsanız:

```bash
pnpm build:shared
# veya: pnpm --filter @besin-denetle/shared build
```

---

## 🔗 İlgili Dökümanlar

- [Server Deployment Rehberi](./server-deployment.md) - Production Setup
- [Operasyon Rehberi](./server-operations-guide.md) - Bakım ve Güncelleme
- [Local Build - EAS (Linux/WSL2)](./mobile-local-build-linux-eas.md)
- [Backend README](../apps/backend/README.md)
