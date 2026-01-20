#!/bin/bash
# PostgreSQL Otomatik Yedekleme Script'i
# .env dosyasından değişkenleri okur
#
# Kullanım:
#   ./backup-db.sh
#
# Cron örneği (her gün gece 3'te):
#   0 3 * * * /opt/besin-denetle/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1

set -e

# Proje dizini
PROJECT_DIR="/opt/besin-denetle"
BACKUP_DIR="/opt/backups/besin-denetle"
ENV_FILE="$PROJECT_DIR/.env"

# .env dosyasından değişkenleri oku
if [ -f "$ENV_FILE" ]; then
    export $(grep -E '^DB_USER=|^DB_NAME=' "$ENV_FILE" | xargs)
fi

# Varsayılan değerler
DB_USER="${DB_USER:-myuser}"
DB_NAME="${DB_NAME:-besindenetle}"

# Tarih damgası
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_${DATE}.sql"

# Backup klasörünü oluştur
mkdir -p "$BACKUP_DIR"

# Yedekleme
cd "$PROJECT_DIR"
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Eski yedekleri temizle (30 günden eski)
find "$BACKUP_DIR" -name "db_*.sql" -type f -mtime +30 -delete

echo "✅ Yedekleme tamamlandı: $BACKUP_FILE"
