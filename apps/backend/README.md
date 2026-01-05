# Besin Denetle - Backend API

Bu modül, Besin Denetle uygulamasının sunucu tarafı mantığını, veritabanı işlemlerini ve AI entegrasyonunu yönetir. **NestJS** framework'ü üzerine inşa edilmiştir.

## 🛠️ Teknoloji Yığını

- **Framework:** NestJS (v11)
- **Language:** TypeScript
- **Database:** PostgreSQL (Relational + JSONB)
- **ORM:** TypeORM
- **AI:** Google Gemini API (Web Search Grounding)
- **Authentication:** JWT, OAuth (Google/Apple Mock)

## ⚙️ Kurulum ve Yapılandırma

### 1. Ortam Değişkenleri

Kök dizindeki `.env.example` dosyasını kopyalayarak `.env` dosyasını oluşturun:

```bash
cp .env.example .env
```

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `PORT` | API Portu | 3200 |
| `DB_HOST` | Veritabanı Sunucusu | localhost |
| `DB_PORT` | Veritabanı Portu | 5432 |
| `DB_USER` | Veritabanı Kullanıcısı | myuser |
| `DB_PASSWORD` | Veritabanı Şifresi | mypassword |
| `DB_NAME` | Veritabanı Adı | besindenetle |
| `GEMINI_API_KEY` | Google Gemini API Anahtarı | (Boş bırakılırsa Mock AI) |
| `MOCK_AUTH` | Test için Auth Bypass | true |
| `JWT_SECRET` | Token İmzalama Anahtarı | (Güçlü bir anahtar girin) |

### 2. Veritabanını Başlatma

Docker Compose kullanarak PostgreSQL veritabanını ayağa kaldırın (proje root dizininde):

```bash
docker-compose up -d
```

### 3. Çalıştırma

Backend uygulamasını geliştirme modunda başlatmak için:

```bash
pnpm dev
# veya kök dizinden:
pnpm backend
```

## 🗄️ Veritabanı Yönetimi (TypeORM)

Migration işlemleri için aşağıdaki komutları kullanabilirsiniz:

```bash
# Migration oluştur
pnpm typeorm migration:generate src/migrations/MigrationName

# Migration çalıştır (DB şemasını günceller)
pnpm typeorm migration:run

# Migration geri al
pnpm typeorm migration:revert
```

## 📡 API endpointleri

Uygulama çalıştığında Swagger dokümantasyonuna (varsa) veya ana endpointlere erişebilirsiniz.

- `POST /auth/oauth`: OAuth girişi
- `POST /products/scan`: Barkod tarama ve AI analizi
- `POST /vote`: Oylama işlemleri
