# TypeORM Migration Rehberi

Bu döküman, Besin Denetle projesinde veritabanı şema değişikliklerinin (migration) nasıl yönetileceğini açıklar.

## 🎯 Genel Bakış

Projede iki farklı veritabanı yönetim stratejisi kullanılmaktadır:

1.  **Development (Local):** `synchronize: true`
    *   `src/config/database.config.ts` dosyasındaki ayar sayesinde, local geliştirmede entity dosyalarındaki değişiklikler anında veritabanına yansır.
    *   Ekstra bir komut çalıştırmaya gerek yoktur.

2.  **Production (VDS):** `synchronize: false`
    *   Veri güvenliği için otomatik senkronizasyon kapalıdır.
    *   Değişiklikler **migration dosyaları** aracılığıyla kontrollü bir şekilde uygulanır.

---

## 🛠️ Migration Yönetimi (Geliştirici)

Production ortamına yeni bir özellik veya veritabanı değişikliği göndereceğiniz zaman aşağıdaki adımları izleyin.

### 1. Hazırlık (Local Veritabanını Sıfırlama)

Migration dosyasının sağlıklı oluşturulması için local veritabanınızın kodunuzla tam eşleşmesi gerekir. En temiz yöntem, local veritabanını sıfırlamaktır (Development verileri silinir).

```bash
# Proje kök dizininde
docker compose down -v  # Sil
docker compose up -d    # Temiz başlat
```

### 2. Migration Dosyası Oluşturma

Backend dizinine gidip generate komutunu çalıştırın:

```bash
cd apps/backend
pnpm db:generate
```

Sistem size migration ismini soracak ve dosyayı otomatik oluşturacaktır.

### 3. Kontrol Etme

`apps/backend/src/migrations` klasöründe yeni oluşan `.ts` dosyasını kontrol edin.

### 4. Git'e Gönderme

Oluşan dosya commitleyip repository'e gönderilecek.

```bash
git add .
git commit -m "feat(db): add users table migration"
git push
```

---

## 🚀 Deployment (Production/VDS)

Production ortamında migration uygulamak ve sistemi güncellemek için **Operasyon Rehberi**'ni kullanın.

👉 **[Operasyon ve Bakım Rehberi (Operations Guide)](./server-operations-guide.md)**

Rehberde bulabileceğiniz işlemler:
1.  Kodların çekilmesi ve build alınması.
2.  `pnpm db:migrate` komutuyla veritabanının güncellenmesi.
3.  Servisin yeniden başlatılması.

---

## ⚠️ Acil Durumlar (Geri Alma)

Eğer migration hatalıysa:

```bash
pnpm db:revert
```

---

## 📜 Komutlar Özeti (Root)

Tüm migration işlemleri ana dizinden yapılabilir:

| Komut | Açıklama |
|---|----------|
| `pnpm db:migrate` | **Uygula:** Migrationları veritabanına işler. |
| `pnpm db:revert` | **Geri Al:** Son migration işlemini geri alır. |
| `pnpm db:show` | **Durum:** Migration geçmişini gösterir. |
