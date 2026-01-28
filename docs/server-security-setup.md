# Server Güvenlik ve Reverse Proxy Kurulumu

![Security](https://img.shields.io/badge/Security-Production-red.svg)
![Caddy](https://img.shields.io/badge/Caddy-2.8+-blue.svg)
![UFW](https://img.shields.io/badge/Firewall-UFW-orange.svg)

Bu rehber, Besin-Denetle backend'inin production ortamında güvenli bir şekilde çalışması için gerekli firewall ve reverse proxy (Caddy) kurulumunu açıklar.

> **Ön Koşul:** [Server Deployment Rehberi](./server-deployment.md) tamamlanmış olmalı.

---

## 📋 İçindekiler

- [Firewall Kurulumu (UFW)](#firewall-kurulumu-ufw)
- [Caddy Kurulumu](#caddy-kurulumu)
- [Domain Yapılandırması](#domain-yapılandırması)
- [SSL Sertifikası](#ssl-sertifikası)
- [Güvenlik Kontrol Listesi](#güvenlik-kontrol-listesi)

---

## 🔥 Firewall Kurulumu (UFW)

Ubuntu'da UFW (Uncomplicated Firewall) ile sadece gerekli portları açıyoruz.

### 1. UFW Kurulumu ve Aktivasyonu

```bash
# UFW kurmak için
sudo apt install ufw -y

# SSH portunu açmak için
sudo ufw allow 22/tcp

# HTTP ve HTTPS portlarını aç
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Firewall'u aktif et
sudo ufw enable

# Durumu kontrol et
sudo ufw status verbose
```

**Beklenen Çıktı:**

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 2. Backend ve Veritabanı Portları

> [!IMPORTANT]
> Backend (50101), Redis (50102) ve PostgreSQL (50103) portlarını **AÇMAYIN**.
> Bu servisler sadece `localhost` üzerinden erişilebilir olmalı.

Caddy reverse proxy üzerinden dış dünyaya sadece 80/443 portları açılır.

---

## 🌐 Caddy Kurulumu

Caddy, otomatik SSL sertifikası sağlayan modern bir reverse proxy'dir.

### 1. Caddy'yi Kur

```bash
# Caddy repository ekle
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Caddy'yi kur
sudo apt update
sudo apt install caddy -y

# Versiyonu kontrol et
caddy version
```

### 2. Caddyfile Yapılandırması

Backend'iniz `localhost:50101` üzerinde çalışıyor ve `/api` prefix'i kullanıyor ise;

```bash
# Caddyfile'ı düzenle
sudo nano /etc/caddy/Caddyfile
```

**Önerilen Gelişmiş Yapılandırma:**

```caddyfile
besindenetle.furkanpasa.com {
    # /api/* isteklerini backend'e yönlendir
    handle /api/* {
        reverse_proxy localhost:50101 {
            # Backend sağlık kontrolü
            health_uri /api/health
            health_interval 60s
        }
    }

    # Ana sayfa yanıtı
    handle {
        respond "Besin Denetle API - by Furkan Paşa" 200
    }

    # Gzip compression
    encode gzip
    
    # Security headers
    header {
        # XSS koruması
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        
        # CORS
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type"
        
        # Referrer policy
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Logging
    log {
        output file /var/log/besin-denetle/caddy/besindenetle.log {
            roll_size 50mb
            roll_keep 4
        }
        format console
    }
}
```

### 3. Log Klasörünü Oluştur

> [!NOTE]
> Merkezi log yönetimi kurulumu için [Server Deployment - Log Yönetimi](./server-deployment.md#8-log-yönetimi-kurulumu) bölümüne bakın.
> Aşağıdaki komutlar sadece Caddy için hızlı kurulum sağlar.

```bash
sudo mkdir -p /var/log/besin-denetle/caddy
sudo chown caddy:caddy /var/log/besin-denetle/caddy
```

### 4. Caddy'yi Başlat

```bash
# Yapılandırmayı test et
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

# Caddy'yi yeniden başlat
sudo systemctl restart caddy

# Durumu kontrol et
sudo systemctl status caddy

# Otomatik başlatmayı aktif et
sudo systemctl enable caddy
```

---

## 🌍 Domain Yapılandırması

### DNS Ayarları

Domain sağlayıcınızda (örn: Cloudflare, GoDaddy) şu DNS kaydını ekleyin:

| Tip | Name | Value | TTL |
|-----|------|-------|-----|
| A | besindenetle | `SUNUCU_IP_ADRESINIZ` | Auto |

**Propagasyon Kontrolü:**

```bash
# DNS'in yayılıp yayılmadığını kontrol et
dig besindenetle.furkanpasa.com

# Veya
nslookup besindenetle.furkanpasa.com
```

---

## 🔒 SSL Sertifikası

Caddy, Let's Encrypt ile **otomatik** SSL sertifikası alır.

### Otomatik SSL (Varsayılan)

Caddy ilk çalıştırıldığında:
1. Domain'iniz için Let's Encrypt'ten sertifika ister
2. HTTP (80) isteklerini otomatik HTTPS (443)'e yönlendirir
3. Sertifikayı otomatik yeniler (90 günde bir)

**Hiçbir şey yapmanıza gerek yok!** 🎉

### SSL Durumunu Kontrol Et

```bash
# Caddy loglarını izle
sudo journalctl -u caddy -f

# Sertifika bilgilerini gör
sudo caddy list-certificates
```

### Manuel SSL Test

```bash
# HTTPS bağlantısını test et
curl -I https://besindenetle.furkanpasa.com/api/health
```

**Beklenen Çıktı:**

```
HTTP/2 200
content-type: application/json; charset=utf-8
```

---

## ✅ Güvenlik Kontrol Listesi

Deployment sonrası bu maddeleri kontrol edin:

### Firewall

- [ ] UFW aktif: `sudo ufw status`
- [ ] Sadece 22, 80, 443 portları açık
- [ ] Backend portu (50101) **kapalı**
- [ ] PostgreSQL portu (50103) **kapalı**
- [ ] Redis portu (50102) **kapalı**

### Caddy

- [ ] Caddy çalışıyor: `sudo systemctl status caddy`
- [ ] SSL sertifikası alındı: `sudo caddy list-certificates`
- [ ] HTTPS yönlendirmesi çalışıyor: `curl -I http://besindenetle.furkanpasa.com`
- [ ] API erişilebilir: `curl https://besindenetle.furkanpasa.com/api/health`

### Backend

- [ ] `.env` dosyasında `MOCK_AUTH=false`
- [ ] `JWT_SECRET` güçlü ve rastgele (min 32 karakter)
- [ ] `DB_PASSWORD` güçlü
- [ ] Backend sadece `localhost:50101` dinliyor

### Sistem

- [ ] PM2 otomatik başlatma aktif: `pm2 startup` + `pm2 save`
- [ ] Caddy otomatik başlatma aktif: `sudo systemctl is-enabled caddy`
- [ ] Sistem güncel: `sudo apt update && sudo apt upgrade`

---

## 🔧 Sorun Giderme

### Caddy SSL Hatası

**Sorun:** `acme: error: 403 :: urn:ietf:params:acme:error:unauthorized`

**Çözüm:**
1. DNS'in doğru IP'ye işaret ettiğini kontrol edin: `dig besindenetle.furkanpasa.com`
2. Port 80 ve 443'ün açık olduğunu doğrulayın: `sudo ufw status`
3. Caddy'nin çalıştığını kontrol edin: `sudo systemctl status caddy`

### Backend'e Erişilemiyor

**Sorun:** `502 Bad Gateway`

**Çözüm:**
```bash
# Backend'in çalışıp çalışmadığını kontrol et
pm2 status

# Backend loglarını incele
pm2 logs besin-denetle

# Backend'i yeniden başlat
pm2 restart besin-denetle
```

### Firewall Sonrası Bağlantı Kesildi

**Sorun:** SSH bağlantısı kesildi

**Çözüm:**
- Sunucu sağlayıcınızın web konsolundan bağlanın
- SSH portunu açın: `sudo ufw allow 22/tcp`
- Firewall'u yeniden başlatın: `sudo ufw reload`

---

## 🔗 İlgili Dökümanlar

- [Server Deployment Rehberi](./server-deployment.md)
- [Operasyon ve Bakım Rehberi](./server-operations-guide.md)
- [Backend README](../apps/backend/README.md)

---

## 📚 Ek Kaynaklar

- [Caddy Resmi Dokümantasyonu](https://caddyserver.com/docs/)
- [UFW Kullanım Kılavuzu](https://help.ubuntu.com/community/UFW)
- [Let's Encrypt Rate Limits](https://letsencrypt.org/docs/rate-limits/)
