# Operasyon ve Bakım Rehberi (Operations Guide)

Bu rehber, Besin-Denetle sunucusunun ilk kurulum sonrası operasyonel süreçlerini kapsar. Sunucu kurulduktan sonra yapılacak güncellemeler, yedeklemeler ve sorun giderme işlemleri burada anlatılmaktadır.

> **İlk Kurulum:** Henüz sunucuyu kurmadıysanız [Server Deployment Rehberi](./server-deployment.md)'ni inceleyin.

---

## 📑 İçindekiler

- [Operasyon ve Bakım Rehberi (Operations Guide)](#operasyon-ve-bakım-rehberi-operations-guide)
  - [📑 İçindekiler](#-i̇çindekiler)
  - [🔄 Sistem Güncelleme](#-sistem-güncelleme)
  - [🗄️ Veritabanı İşlemleri](#️-veritabanı-i̇şlemleri)
  - [🩺 Monitoring & Loglar](#-monitoring--loglar)
    - [PM2 Komut Referansı](#pm2-komut-referansı-pm2-command-reference)
    - [Veritabanı Logları (Docker)](#veritabanı-logları-docker)
  - [💾 Yedekleme (Backup)](#-yedekleme-backup)
    - [Manuel Yedekleme](#manuel-yedekleme)
    - [Geri Yükleme (Restore)](#geri-yükleme-restore)
    - [Otomatik Yedekleme](#otomatik-yedekleme)
  - [🔧 Sorun Giderme (Troubleshooting)](#-sorun-giderme-troubleshooting)
    - [Rate Limit Sıfırlama](#rate-limit-sıfırlama)
    - [Cache Temizleme](#cache-temizleme)

---

## 🔄 Sistem Güncelleme

Uygulamayı en son sürüme güncellemek için sunucuda aşağıdaki adımları izleyin:

```bash
cd /opt/besin-denetle

# 1. Kodları Çek
git pull origin main

# 2. Bağımlılıkları Güncelle
pnpm install

# 3. Build Al
pnpm build:all

# 4. Veritabanı Migrationlarını Çalıştır
pnpm db:migrate

# 5. Servisi Yeniden Başlat (Kesintisiz)
pnpm restart:prod
```

> **Not:** Eğer `.env` dosyasında bir değişiklik yapıldıysa, restart işleminden önce güncellemelisiniz.

---

## 🗄️ Veritabanı İşlemleri

Production ortamında `db:*` kısayol komutlarını kullanabilirsiniz.

| Komut             | Açıklama                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `pnpm db:migrate` | **Uygula:** Bekleyen migrationları veritabanına işler.                      |
| `pnpm db:show`    | **Durum:** Hangi migrationların çalıştığını gösterir.                       |
| `pnpm db:revert`  | **Geri Al:** Son yapılan migration işlemini geri alır (Acil durumlar için). |

> ⚠️ **Uyarı:** Production ortamında `revert` işlemi veri kaybına yol açabilir. Dikkatli kullanın.

Detaylı teknik bilgi için: [TypeORM Migration Rehberi](./typeorm-migration-guide.md)

---

## 🩺 Monitoring & Loglar

### PM2 Komut Referansı (PM2 Command Reference)

Backend uygulaması **PM2 Process Manager** ile yönetilir. İşte en sık kullanılan komutlar:

#### 📊 Durum ve İzleme

| Komut                    | Açıklama                                                                         |
| ------------------------ | -------------------------------------------------------------------------------- |
| `pm2 status`             | Tüm servislerin durumunu (online/error), işlemci ve bellek kullanımını listeler. |
| `pm2 logs`               | Tüm servislerin loglarını canlı izler.                                           |
| `pm2 logs besin-backend` | Sadece backend servisinin loglarını izler.                                       |
| `pm2 monit`              | Terminal arayüzü ile CPU/RAM kullanımını ve logları anlık gösterir.              |

#### 🔄 Başlatma ve Yeniden Başlatma

| Komut                       | Açıklama                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm start:prod`           | Uygulamayı PM2 ile başlatır (veya zaten çalışıyorsa yeniden başlatır).                                           |
| `pm2 reload besin-backend`  | **(Önerilen)** Servisi _kesintisiz_ (zero-downtime) yeniden başlatır. Cluster modunda işlemleri sırayla yeniler. |
| `pm2 restart besin-backend` | Servisi tamamen durdurup yeniden başlatır. Kısa süreli kesinti olabilir.                                         |
| `pm2 stop besin-backend`    | Servisi durdurur.                                                                                                |
| `pm2 delete besin-backend`  | Servisi PM2 listesinden tamamen siler.                                                                           |

#### ⚙️ Yapılandırma ve Kayıt

| Komut         | Açıklama                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `pm2 startup` | **(İlk Kurulum)** Sunucu açılışında PM2'nun otomatik başlaması için gereken komutu üretir.                                             |
| `pm2 save`    | **(Her Değişiklikte)** Mevcut çalışan uygulama listesini kaydeder. Sunucu yeniden başladığında _burada kaydedilen_ liste ayağa kalkar. |

> [!TIP]
>
> 1. Önce `pm2 startup` çalıştırın ve size verdiği komutu terminale yapıştırın (Bunu sunucuda sadece bir kez yaparsınız).
> 2. Uygulamalarınızı başlatın (`pnpm start:prod`).
> 3. Son olarak `pm2 save` çalıştırarak bu listeyi kalıcı hale getirin.
>    _Eğer yeni bir uygulama ekler veya çıkarırsanız, tekrar `pm2 save` yapmayı unutmayın._

### Veritabanı Logları (Docker)

PostgreSQL ve Redis Docker container içinde çalışır.

```bash
# Veritabanı logları
docker compose logs -f db

# Redis logları
docker compose logs -f redis
```

---

## 💾 Yedekleme (Backup)

### Manuel Yedekleme

```bash
# Sadece veritabanı yedeği al
docker compose exec db pg_dump -U myuser besindenetle > backup_$(date +%Y%m%d).sql
```

### Geri Yükleme (Restore)

```bash
# Yedeği veri tabanına yükle (Mevcut verileri ezebilir!)
cat backup_dosyasi.sql | docker compose exec -T db psql -U myuser besindenetle
```

### Otomatik Yedekleme

Projede `scripts/backup-db.sh` dosyası bulunur. Bunu crontab'a ekleyerek günlük yedek alabilirsiniz.

```bash
# Crontab'ı düzenle
crontab -e

# Şunu ekle (Her gece 03:00):
0 3 * * * /opt/besin-denetle/scripts/backup-db.sh >> /var/log/besin-denetle/db-backup.log 2>&1
```

---

## 🔧 Sorun Giderme (Troubleshooting)

### Rate Limit Sıfırlama

Eğer Redis tabanlı rate limit sayaçlarını sıfırlamanız gerekirse:

```bash
# Redis'teki tüm rate limit key'lerini temizler
docker compose exec redis redis-cli KEYS "rl:*" | xargs docker compose exec redis redis-cli DEL
```

### Cache Temizleme

Redis cache'ini tamamen temizlemek için:

```bash
docker compose exec redis redis-cli FLUSHALL
```
