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
cp apps/backend/.env.example apps/backend/.env
nano apps/backend/.env
```

> [!IMPORTANT]
> Production için **mutlaka** şunları değiştirin:
>
> - `JWT_SECRET`: Min 32 karakterlik rastgele değer
> - `DB_PASSWORD`: Güçlü veritabanı şifresi
> - `DB_HOST`: `localhost` olarak bırakın (PostgreSQL aynı makinede)

### 6. PostgreSQL Container'ını Başlat

```bash
docker compose up -d db
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

### 8. Backend'i PM2 ile Başlat

```bash
cd /opt/besin-denetle

# PM2 ile başlat
# (pm2 start apps/backend/dist/main.js --name besin-backend)
pnpm start:prod
```

### 9. PM2 Otomatik Başlatma

```bash
# Startup script oluştur
pm2 startup

# Mevcut process listesini kaydet
pm2 save
```

### 10. PM2 Komutları

```bash
# Durumu kontrol et
pm2 status

# Logları izle
pm2 logs besin-backend

# Sırayla yeniden başlat (kesintisiz)
pm2 reload besin-backend

# Tamamen yeniden başlat
pm2 restart besin-backend

# Kaldımak için
pm2 delete besin-backend
```

## s

## 🔒 Güvenlik Ayarları

### Production Güvenlik Kontrol Listesi

> [!IMPORTANT]
> Production'a geçmeden önce bu maddeleri kontrol edin:

- [ ] **JWT_SECRET:** Güçlü, rastgele bir değer (min 32 karakter)
- [ ] **DB_PASSWORD:** Güçlü veritabanı şifresi
- [ ] **MOCK_AUTH:** `false` olarak ayarla
- [ ] **Firewall:** Sadece 80/443 portları açık, 5432 kapalı
- [ ] **SSL:** Caddy veya Nginx ile HTTPS aktif
- [ ] **Backup:** Otomatik yedekleme cron'u kurulu

### Firewall (UFW)

```bash
# UFW'yi etkinleştir
sudo ufw enable

# SSH'e izin ver
sudo ufw allow ssh

# HTTP/HTTPS'e izin ver
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# PostgreSQL portunu KAPATILI tut (dışarıdan erişim yok)
# 5432 portu sadece localhost'tan erişilebilir

# Durumu kontrol et
sudo ufw status
```

### Fail2ban (Opsiyonel)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🌐 Reverse Proxy (Caddy)

SSL sertifikası ve domain yönlendirmesi için Caddy önerilir:

### Caddy Kurulumu

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Caddyfile Yapılandırması

```bash
sudo nano /etc/caddy/Caddyfile
```

İçerik:

```
api.besindenetle.com {
    reverse_proxy localhost:3200
}
```

```bash
sudo systemctl restart caddy
```

> **Not:** Caddy otomatik olarak Let's Encrypt'ten SSL sertifikası alır.

---

## 💾 Yedekleme

### PostgreSQL Yedekleme

```bash
# Manuel yedek al
docker compose exec db pg_dump -U myuser besindenetle > backup_$(date +%Y%m%d).sql

# Geri yükleme
cat backup_20240101.sql | docker compose exec -T db psql -U myuser besindenetle
```

### Otomatik Yedekleme (Cron)

```bash
# Backup klasörü oluştur
sudo mkdir -p /opt/backups

crontab -e
```

Ekle (her gün gece 3'te):

```
0 3 * * * cd /opt/besin-denetle && docker compose exec -T db pg_dump -U myuser besindenetle > /opt/backups/db_$(date +\%Y\%m\%d).sql
```

---

## 🔄 Güncelleme

```bash
cd /opt/besin-denetle

# En son kodu çek
git pull origin main

# Bağımlılıkları güncelle
pnpm install

# Projeyi yeniden build et
pnpm build:all

# PM2'yi yeniden başlat
pnpm restart:prod
```

---

## 🩺 Monitoring

### Health Check

```bash
curl http://localhost:3200/health
```

### PM2 Monitoring

```bash
# Process durumu
pm2 status

# Canlı log akışı
pm2 logs besin-backend

# Son 100 satır log
pm2 logs besin-backend --lines 100

# Gerçek zamanlı dashboard
pm2 monit

# Kaynak kullanımı
pm2 show besin-backend
```

### PostgreSQL Durumu

```bash
docker compose ps
docker compose logs db
```

---

## 🔗 İlgili Dökümanlar

- [Docker Development Rehberi](./docker-development.md)
- [Local Build - EAS (Linux/WSL2)](./local-build-linux-eas.md)
- [Backend README](../apps/backend/README.md)
