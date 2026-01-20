# Rate Limiting Rehberi

![Redis](https://img.shields.io/badge/Redis-7+-dc382d.svg)
![NestJS](https://img.shields.io/badge/NestJS-v11-e0234e.svg)
![Type](https://img.shields.io/badge/Type-User_Based-blue.svg)

Bu rehber, Besin-Denetle API'nin **rate limiting** sistemini açıklar. Redis tabanlı merkezi sayaç yönetimi ile PM2 çoklu instance desteği sağlanır.

> **Backend README için:** [Backend API Dokümantasyonu](../apps/backend/README.md)

---

## 📑 İçindekiler

- [Rate Limiting Rehberi](#rate-limiting-rehberi)
  - [📑 İçindekiler](#-i̇çindekiler)
  - [🏗️ Mimari](#️-mimari)
  - [⚙️ Konfigürasyon](#️-konfigürasyon)
  - [📊 Limit Tabloları](#-limit-tabloları)
  - [🔄 DB/AI Ayrımı](#-dbai-ayrımı)
  - [🌐 Cloudflare Uyumluluğu](#-cloudflare-uyumluluğu)
  - [🚨 Hata Yanıtları](#-hata-yanıtları)
  - [🩺 Troubleshooting](#-troubleshooting)
  - [🔗 İlgili Dökümanlar](#-i̇lgili-dökümanlar)

---

## 🏗️ Mimari

| Bileşen | Değer |
|---------|-------|
| **Storage** | Redis (PM2 çoklu instance için) |
| **Yaklaşım** | Service-based (`RateLimitService`) |
| **Strateji** | Fail-closed (Redis yoksa reddet) |
| **Hata mesajları** | İngilizce |

### Dosya Yapısı

```text
apps/backend/src/
├── config/
│   └── rate-limit.config.ts    # Limit değerleri ve Redis ayarları
├── common/rate-limit/
│   ├── rate-limit.service.ts   # Ana servis (Redis işlemleri)
│   ├── rate-limit.types.ts     # TypeScript tipleri
│   └── rate-limit.module.ts    # Global NestJS modülü
```

---

## ⚙️ Konfigürasyon

### Environment Değişkenleri

`.env` dosyasına ekleyin:

```env
# Redis bağlantısı
REDIS_HOST=localhost
REDIS_PORT=50102
```

### Docker Compose

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  container_name: besin_denetle_redis
  ports:
    - "50102:6379"
  volumes:
    - redis_data:/data
```

---

## 📊 Limit Tabloları

### Havuz Limitleri (Dakikalık)

Birden fazla endpoint aynı havuzu paylaşır:

| Limit | Değer | Endpoint'ler |
|-------|-------|--------------|
| `scan_db` | 12/dk | `/products/scan`, `/products/reject` |
| `scan_ai` | 6/dk | `/products/scan`, `/products/reject` |
| `content_db` | 10/dk | `/products/confirm`, `/content/reject` |
| `content_ai` | 5/dk | `/products/confirm`, `/content/reject` |
| `analysis_db` | 10/dk | `/analysis/generate`, `/analysis/reject` |
| `analysis_ai` | 5/dk | `/analysis/generate`, `/analysis/reject` |

### Endpoint Limitleri (Dakikalık)

Tek endpoint için ek kısıtlama:

| Limit | Değer | Endpoint |
|-------|-------|----------|
| `scan_reject` | 3/dk | `/products/reject` |
| `content_reject` | 3/dk | `/content/reject` |
| `analysis_reject` | 3/dk | `/analysis/reject` |
| `flag` | 5/dk | `/barcodes/flag` |

### Global Limitler (Saatlik/Günlük)

| Limit | Saat | Gün | Açıklama |
|-------|------|-----|----------|
| `total_db` | 180 | 360 | Tüm DB çağrıları |
| `total_ai` | 90 | 180 | Tüm AI çağrıları |
| `total_reject` | 90 | 180 | Tüm reject işlemleri |

### Auth Limitleri

| Endpoint | Tip | Limit | Config Key |
|----------|-----|-------|------------|
| `/auth/oauth` | IP | 5/dk | `oauth_ip` |
| `/auth/email-signup` | IP | 5/dk | `email_signup_ip` |
| `/auth/register` | IP | 5/dk | `register_ip` |
| `/auth/refresh` | IP | 20/dk | `refresh_ip` |
| `/auth/logout` | User | 20/dk | `logout_user` |
| `/auth/delete-account` | User | **1/saat** | `delete_user` |

### Health Limiti

| Endpoint | Tip | Limit |
|----------|-----|-------|
| `/health` | IP | 3/dk |

---

## 🔄 DB/AI Ayrımı

Rate limiting, veritabanı ve AI çağrılarını **mutual exclusive** olarak sayar:

```
/products/scan çağrıldığında:
├── DB'de bulundu (cache hit)
│   └── scan_db +1, scan_ai değişmez
│
└── DB'de bulunamadı (AI çağrısı)
    └── scan_db değişmez, scan_ai +1
```

> [!NOTE]
> Bu sayede kullanıcı, AI maliyeti oluşturmadan DB'den veri çekmeye devam edebilir.

---

## 🌐 Cloudflare Uyumluluğu

IP bazlı limitler için gerçek client IP şu sırayla alınır:

1. `CF-Connecting-IP` header (Cloudflare öncelik)
2. `X-Forwarded-For` header (proxy fallback)
3. Socket IP (son çare)

```typescript
// Örnek: Auth controller'da kullanım
private getClientIp(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return Array.isArray(cfIp) ? cfIp[0] : cfIp;
  // ...
}
```

---

## 🚨 Hata Yanıtları

Limit aşıldığında `429 Too Many Requests` döner:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded for scan_ai. Try again in 45 seconds.",
  "retryAfter": 45
}
```

### HTTP Headers

```
Retry-After: 45
```

---

## 🩺 Troubleshooting

### Redis bağlantı hatası

```bash
# Redis durumunu kontrol et
docker compose exec redis redis-cli ping
# Beklenen yanıt: PONG

# Container'ı yeniden başlat
docker compose restart redis
```

### Rate limit çalışmıyor

1. Redis bağlantısını kontrol et (log'larda "Connected to Redis" olmalı)
2. `.env` dosyasında `REDIS_HOST` ve `REDIS_PORT` doğru mu?
3. Redis yoksa tüm istekler **503 Service Unavailable** ile reddedilir

### Sayaçları sıfırlama

```bash
# Tüm rate limit key'lerini sil
docker compose exec redis redis-cli KEYS "rl:*" | xargs docker compose exec redis redis-cli DEL
```

> [!CAUTION]
> Bu komut tüm kullanıcıların limitlerini sıfırlar. Sadece development ortamında kullanın!

---

## 🔗 İlgili Dökümanlar

- [Backend README](../apps/backend/README.md) - API endpoint'leri ve kurulum
- [Docker Development Rehberi](./docker-development.md) - Local development
- [Server Ubuntu Deployment](./server-ubuntu-deployment.md) - Production deployment
