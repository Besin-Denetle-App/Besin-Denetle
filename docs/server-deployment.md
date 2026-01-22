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

### 7. Bağımlılıkları Yükle ve Build Et

```bash
# Tüm bağımlılıkları yükle
pnpm install

# Shared + Backend'i build et
# (pnpm build:shared && pnpm build:backend)
pnpm build:all
```

### 8. Database Migration'larını Çalıştır

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


### 9. Backend'i PM2 ile Başlat

```bash
cd /opt/besin-denetle

# PM2 ile başlat
# (pm2 start apps/backend/dist/main.js --name besin-backend)
pnpm start:prod
```

### 10. PM2 Otomatik Başlatma

```bash
# Startup script oluştur
sudo pm2 startup

# Mevcut process listesini kaydet
pm2 save
```

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

*(Firewall ve Caddy kurulum detayları için [Operasyon Rehberi](./server-operations-guide.md)'ne bakınız.)*

---

## ⏭️ Sonraki Adımlar (İşletim ve Bakım)

Sunucunuz artık çalışıyor! 🎉

Güncelleme, yedekleme, migration ve monitoring işlemleri için lütfen **Operasyon Rehberi**'ne geçin:

👉 **[Operasyon ve Bakım Rehberi (Operations Guide)](./server-operations-guide.md)**

---

## 🔗 İlgili Dökümanlar

- [Operasyon ve Bakım Rehberi](./server-operations-guide.md) - Güncelleme, Yedekleme, Monitoring
- [Docker Development Rehberi](./docker-development.md)
- [Backend README](../apps/backend/README.md)
