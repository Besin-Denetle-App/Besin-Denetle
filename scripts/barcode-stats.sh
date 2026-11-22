#!/bin/bash
#
# Barcode Type Stats Script
# Docker'daki veritabanından barkod türü istatistiklerini çeker.
#
# Kullanım: ./scripts/barcode-stats.sh

# Script'in bulunduğu dizini bul ve .env dosyasını yükle
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Hata: .env dosyası bulunamadı: $ENV_FILE"
  exit 1
fi

export $(grep -E '^(DB_USER|DB_NAME)=' "$ENV_FILE" | xargs)

if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo "❌ Hata: .env dosyasında DB_USER veya DB_NAME tanımlı değil"
  exit 1
fi

echo "📊 Barcode Type İstatistikleri"
echo "────────────────────────────────────────"
echo ""
echo "Type Açıklamaları:"
echo "  0 = Kararsız"
echo "  1 = Yiyecek"
echo "  2 = İçecek"
echo "  3 = Evcil Hayvanlar"
echo "  9 = Kapsam Dışı"
echo ""
echo "────────────────────────────────────────"

docker exec besin_denetle_db psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as yuzde
FROM barcode 
GROUP BY type 
ORDER BY type;
"

echo ""
echo "Toplam barkod sayısı:"
docker exec besin_denetle_db psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM barcode;"
