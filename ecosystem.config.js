/**
 * PM2 Ecosystem Configuration
 * Production ortamında backend'i başlatmak için kullanılır.
 *
 * Kullanım:
 *   pnpm start:prod           - PM2 ile başlat
 *   pm2 startup               - Startup script oluştur
 *   pm2 save                  - Mevcut process listesini kaydet
 *   pm2 status                - Durumu kontrol et
 *   pm2 logs besin-backend    - Logları izle
 *   pm2 reload besin-backend  - Sırayla yeniden başlat (kesintisiz)
 *   pm2 restart besin-backend - Tamamen yeniden başlat
 *
 * Not: .env dosyası root dizininde olmalı
 */
const path = require("path");
const fs = require("fs");

// .env dosyasını oku ve parse et
function loadEnvFile(envPath) {
  const env = {};
  try {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      // Yorum satırlarını ve boş satırları atla
      if (line.startsWith("#") || !line.trim()) return;
      const [key, ...valueParts] = line.split("=");
      if (key) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    });
  } catch {
    console.warn(`⚠️ .env dosyası okunamadı: ${envPath}`);
  }
  return env;
}

// .env dosyasının yolunu belirle (root dizin)
const envPath = path.join(__dirname, ".env");
const envVars = loadEnvFile(envPath);

module.exports = {
  apps: [
    {
      name: "besin-backend",
      script: "apps/backend/dist/main.js",
      cwd: __dirname,
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M",
      env: {
        ...envVars,
        NODE_ENV: "production", // PM2 her zaman production modunda
      },
    },
  ],
};
