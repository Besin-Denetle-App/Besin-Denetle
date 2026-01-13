# Docker Development Rehberi

![Docker](https://img.shields.io/badge/Docker-24+-2496ed.svg)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2+-2496ed.svg)
![Environment](https://img.shields.io/badge/Environment-Development-yellow.svg)

Bu rehber, Besin-Denetle projesini **local development** ortamında Docker ile nasıl çalıştıracağınızı açıklar.

> **Production deployment için:** [Server Ubuntu Deployment Rehberi](./server-ubuntu-deployment.md)

---

## 📋 Gereksinimler

- Docker Engine 24+
- Docker Compose v2+

---

## 🚀 Hızlı Başlangıç

### 1. Environment Dosyasını Hazırla

Proje root dizininde `.env` dosyası oluştur:

```bash
cp apps/backend/.env.example .env
```

Tüm değişkenlerin açıklaması için:
👉 **[Backend README - Ortam Değişkenleri](../apps/backend/README.md#1-ortam-değişkenleri-env)**

> [!IMPORTANT]
> En azından `JWT_SECRET` ve `DB_PASSWORD` değerlerini değiştirmeyi unutmayın!

### 2. Servisleri Başlat

```bash
docker compose up -d
```

### 3. Durumu Kontrol Et

```bash
docker compose ps
docker compose logs -f backend
```

---

## 📦 Kullanım Komutları

| Komut | Açıklama |
|-------|----------|
| `docker compose up -d` | Servisleri başlat (arka planda) |
| `docker compose down` | Servisleri durdur |
| `docker compose down -v` | Servisleri ve verileri sil |
| `docker compose logs -f` | Logları takip et |
| `docker compose logs backend` | Sadece backend logları |
| `docker compose ps` | Servis durumları |
| `docker compose restart backend` | Backend'i yeniden başlat |
| `docker compose build --no-cache` | Image'ı sıfırdan build et |

---

## 🔧 Servisler

### PostgreSQL (db)

- **Port:** 5432
- **Container:** `besin_denetle_db`
- **Volume:** `postgres_data` (veriler kalıcı)

Veritabanına bağlanmak için:
```bash
docker compose exec db psql -U myuser -d besindenetle
```

### Backend API

- **Port:** 3200
- **Container:** `besin_denetle_backend`
- **Health endpoint:** `http://localhost:3200/health`

---

## 🩺 Troubleshooting

### Backend başlamıyor

```bash
# Logları kontrol et
docker compose logs backend

# Container'a gir
docker compose exec backend sh
```

### Veritabanı bağlantı hatası

Backend, veritabanının hazır olmasını bekler. Eğer hâlâ sorun varsa:

```bash
# Veritabanı durumunu kontrol et
docker compose exec db pg_isready -U myuser

# Servisleri yeniden başlat
docker compose restart
```

### Image güncelleme

Kod değişikliği sonrası:

```bash
docker compose build backend
docker compose up -d backend
```

---

## 🔗 İlgili Dökümanlar

- [Server Ubuntu Deployment Rehberi](./server-ubuntu-deployment.md) - Production güvenlik ayarları, SSL, yedekleme
- [Local Build - EAS (Linux/WSL2)](./local-build-linux-eas.md)
