/**
 * PM2 Ecosystem Configuration
 * Production ortamında backend'i başlatmak için kullanılır.
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
      name: "besin-denetle",
      script: "apps/backend/dist/main.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M",
      env: {
        ...envVars,
        NODE_ENV: "production", // PM2 her zaman production modunda
      },
      time: true, // Loglara zaman damgası ekle
      // Log rotation ayarları
      log_date_format: "YYYY-MM-DDTHH:mm:ss",
      error_file: "/var/log/besin-denetle/pm2/besin-denetle-error.log",
      out_file: "/var/log/besin-denetle/pm2/besin-denetle-out.log",
      merge_logs: true, // Tüm instance'ların loglarını birleştir
      max_restarts: 10, // 10 restart sonrası durdurmayı durdur (crash loop koruması)
      min_uptime: "10s", // En az 10 saniye çalışmazsa restart sayılır
    },
  ],
};
