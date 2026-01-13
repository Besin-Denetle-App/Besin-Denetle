# Server Ubuntu Deployment Rehberi

![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04+-e95420.svg)
![Docker](https://img.shields.io/badge/Docker-24+-2496ed.svg)
![Environment](https://img.shields.io/badge/Environment-Production-brightgreen.svg)

Bu rehber, Besin-Denetle backend'ini Ubuntu Server üzerinde production ortamında çalıştırmayı açıklar.

---

## 📋 Gereksinimler

| Bileşen | Minimum | Önerilen |
|---------|---------|----------|
| Ubuntu | 22.04 LTS | 24.04 LTS |
| RAM | 1 GB | 2 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 20 GB | 40 GB |

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

### 3. Projeyi Klonla

```bash
cd /opt
sudo mkdir besin-denetle
sudo chown $USER:$USER besin-denetle
cd besin-denetle

git clone https://github.com/Furkan-Pasa/Besin-Denetle.git .
```

### 4. Environment Dosyasını Hazırla

```bash
cp apps/backend/.env.example .env
nano .env
```

Tüm değişkenlerin açıklaması için:
👉 **[Backend README - Ortam Değişkenleri](../apps/backend/README.md#1-ortam-değişkenleri-env)**

> [!IMPORTANT]
> Production için **mutlaka** şunları değiştirin:
> - `JWT_SECRET`: Min 32 karakterlik rastgele değer
> - `DB_PASSWORD`: Güçlü veritabanı şifresi

### 5. Servisleri Başlat

```bash
docker compose up -d
docker compose ps
```

---

## 🔄 Systemd Servisi (Otomatik Başlatma)

Sunucu yeniden başladığında Docker Compose'un otomatik çalışması için:

```bash
sudo nano /etc/systemd/system/besin-denetle.service
```

İçerik:
```ini
[Unit]
Description=Besin Denetle Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/besin-denetle
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Servisi etkinleştir:
```bash
sudo systemctl daemon-reload
sudo systemctl enable besin-denetle.service
sudo systemctl start besin-denetle.service
```

---

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
# 5432 portu sadece Docker network içinde erişilebilir

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

# Image'ı yeniden build et
docker compose build --no-cache backend

# Servisleri yeniden başlat
docker compose up -d
```

---

## 🩺 Monitoring

### Basit Health Check

```bash
curl http://localhost:3200/health
```

### Logları İzleme

```bash
# Tüm loglar
docker compose logs -f

# Sadece backend
docker compose logs -f backend

# Son 100 satır
docker compose logs --tail 100 backend
```

---

## 📊 Kaynak Kullanımı

```bash
docker stats
```

---

## 🔗 İlgili Dökümanlar

- [Docker Development Rehberi](./docker-development.md)
- [Local Build - EAS (Linux/WSL2)](./local-build-linux-eas.md)
