# Server Ubuntu Deployment Rehberi

![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04+-e95420.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen.svg)
![PM2](https://img.shields.io/badge/PM2-Process_Manager-2B037A.svg)
![Environment](https://img.shields.io/badge/Environment-Production-brightgreen.svg)

Bu rehber, Besin-Denetle backend'ini Ubuntu Server üzerinde production ortamında çalıştırmayı açıklar.

**Mimari:** PostgreSQL Docker container'da, Backend ise PM2 ile doğrudan çalışır.

---

## 📋 Gereksinimler

| Bileşen | Minimum   | Önerilen  |
| ------- | --------- | --------- |
| Ubuntu  | 22.04 LTS | 24.04 LTS |
| RAM     | 1 GB      | 2 GB      |
| CPU     | 1 vCPU    | 2 vCPU    |
| Disk    | 20 GB     | 40 GB     |

**Yazılım Gereksinimleri:**

- Docker Engine 24+
- Node.js 20+
- PNPM 8+
- PM2

---

## 🚀 Kurulum Adımları

### 1. Sistemi Güncelle

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Docker Kurulumu

```bash
# Docker GPG key ekle
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Repository ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker kur
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER
newgrp docker

# Doğrula
docker --version
docker compose version
```

### 3. Node.js + PNPM + PM2 Kurulumu

```bash
# Node.js 20 LTS kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PNPM kur
npm install -g pnpm

# PM2 kur
npm install -g pm2

# Doğrula
node --version
pnpm --version
pm2 --version
```

### 4. Projeyi Klonla

```bash
cd /opt
sudo mkdir besin-denetle
sudo chown $USER:$USER besin-denetle
cd besin-denetle

git clone git@github.com:Besin-Denetle-App/Besin-Denetle.git .
```

### 5. Environment Dosyasını Hazırla

```bash
cp .env.example .env
nano .env
```

> [!IMPORTANT]
> Production için **mutlaka** şunları değiştirin:
>
> - `JWT_SECRET`: Min 32 karakterlik rastgele değer
> - `DB_PASSWORD`: Güçlü veritabanı şifresi
> - `DB_HOST`: `localhost` olarak bırakın (PostgreSQL aynı makinede)

### 6. PostgreSQL ve Redis Container'larını Başlat

```bash
export $(grep -v '^#' .env | xargs)
docker compose up -d
docker compose ps
```

### 7. Redis İçin Sistem Ayarları

> [!IMPORTANT]
> Redis'in production'da stabil çalışması için Linux kernel ayarı gereklidir.
> Bu ayar yapılmazsa Redis uyarı verir ve veri kaybı riski oluşabilir.

```bash
# Memory overcommit'i aktifleştir (kalıcı)
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Ne yapar?**

- Redis'in arka planda veri kaydetme (AOF/RDB) işlemlerinde bellek yetersizliği sorununu önler
- Milyonlarca production sunucuda standart ayardır
- Redis dokümantasyonu tarafından **zorunlu** kabul edilir

**Doğrulama:**

```bash
# Ayarın aktif olduğunu kontrol et
sysctl vm.overcommit_memory
# Çıktı: vm.overcommit_memory = 1 olmalı
```

### 8. Log Yönetimi Kurulumu

Tüm servis loglarını merkezi bir klasörde toplamak için log yapısını oluşturun:

```bash
# 1. Log grubu oluştur
sudo groupadd besin-denetle-logs

# 2. İlgili kullanıcıları gruba ekle
sudo usermod -aG besin-denetle-logs caddy
sudo usermod -aG besin-denetle-logs $USER  # PM2'yi çalıştıran kullanıcı

# 3. Ana log klasörünü oluştur
sudo mkdir -p /var/log/besin-denetle
sudo chown root:besin-denetle-logs /var/log/besin-denetle
sudo chmod 775 /var/log/besin-denetle

# 4. Servis klasörlerini oluştur
sudo mkdir -p /var/log/besin-denetle/{caddy,pm2,postgres,backend}

# 5. Sahiplik ayarla
sudo chown caddy:besin-denetle-logs /var/log/besin-denetle/caddy
sudo chown $USER:besin-denetle-logs /var/log/besin-denetle/pm2
sudo chown postgres:besin-denetle-logs /var/log/besin-denetle/postgres
sudo chown $USER:besin-denetle-logs /var/log/besin-denetle/backend

# 6. İzinleri ayarla ve setgid aktifleştir
sudo chmod 775 /var/log/besin-denetle/{caddy,pm2,postgres,backend}
sudo chmod g+s /var/log/besin-denetle /var/log/besin-denetle/{caddy,pm2,postgres,backend}
```

**Oluşan Yapı:**

```
/var/log/besin-denetle/
├── caddy/          # Caddy web server logları
├── pm2/            # PM2 process manager logları
├── postgres/       # PostgreSQL logları
└── backend/        # Backend uygulama logları (winston)
    ├── app/            # Business ve database logları
    ├── error/          # Hata logları
    ├── security/       # Güvenlik olayları
    ├── http/           # HTTP request/response
    └── infrastructure/ # Sistem durumu (Redis, AI vb.)
```

> [!TIP]
> `setgid` (g+s) sayesinde bu klasörlerde oluşturulan yeni dosyalar otomatik olarak `besin-denetle-logs` grubuna ait olur.

### 9. Bağımlılıkları Yükle ve Build Et

```bash
# Tüm bağımlılıkları yükle
pnpm install

# Shared + Backend'i build et
# (pnpm build:shared && pnpm build:backend)
pnpm build:all
```

### 10. Database Migration'larını Çalıştır

> [!IMPORTANT]
> İlk kurulumda veya database güncellemeleri için migration'ları çalıştırmalısınız.
> Detaylı bilgi için: [TypeORM Migration Rehberi](./typeorm-migration-guide.md)

```bash
cd /opt/besin-denetle

# Migration durumunu kontrol et
pnpm db:show

# Migration'ları çalıştır (tabloları oluşturur)
pnpm db:migrate
```

**Beklenen Çıktı:**

```
query: SELECT * FROM "migrations" "migrations"
query: CREATE TABLE "user" ...
query: CREATE TABLE "product" ...
Migration InitialSchema1737509400000 has been executed successfully.
```

> [!NOTE]
> Migration'lar sadece bir kez çalışır. Eğer zaten çalıştırılmışlarsa, tekrar çalıştırılmazlar.

### 11. Backend'i PM2 ile Başlat

```bash
cd /opt/besin-denetle

# PM2 ile başlat
pnpm start:prod
```

> [!TIP]
> Logları izlemek, yeniden başlatmak veya sunucu başlangıcında otomatik çalışmasını sağlamak için detaylı komutları **[Operasyon Rehberi - PM2 Referansı](./server-operations-guide.md#pm2-komut-referansı-pm2-command-reference)** bölümünde bulabilirsiniz.

---

## 🔒 Güvenlik Ayarları

### Production Güvenlik Kontrol Listesi

> [!IMPORTANT]
> Production'a geçmeden önce bu maddeleri kontrol edin:

- [ ] **JWT_SECRET:** Güçlü, rastgele bir değer (min 32 karakter)
- [ ] **DB_PASSWORD:** Güçlü veritabanı şifresi
- [ ] **MOCK_AUTH:** `false` olarak ayarla
- [ ] **Firewall:** Sadece 80/443 portları açık, 50103 kapalı (Opsiyonel)
- [ ] **SSL:** Caddy veya Nginx ile HTTPS aktif

_(Firewall ve Caddy kurulum detayları için [Server Güvenlik Kurulum Rehberi](./server-security-setup.md)'ne bakınız.)_

---

## ⏭️ Sonraki Adımlar (İşletim ve Bakım)

Sunucunuz artık çalışıyor! 🎉

Güncelleme, yedekleme, migration ve monitoring işlemleri için lütfen **Operasyon Rehberi**'ne geçin:

👉 **[Operasyon ve Bakım Rehberi (Operations Guide)](./server-operations-guide.md)**

---

## 🔗 İlgili Dökümanlar

- [Docker Development Rehberi](./docker-development.md)
- [Backend README](../apps/backend/README.md)
