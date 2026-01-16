/**
 * CSV Import Scripti
 *
 * Kullanım: pnpm import-csv [csv-dosyası]
 * Örnek: pnpm import-csv ./data/urunler.csv
 *
 * CSV dosyasından ürün verilerini veritabanına aktarır.
 */

import csv from 'csv-parser';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import {
  Barcode,
  ContentAnalysis,
  Product,
  ProductContent,
  User,
  Vote,
} from '../entities';

// .env dosyasını yükle
config();

// CSV row tip tanımı
interface CsvRow {
  barcode?: string;
  name?: string;
  brand?: string;
  quantity?: string;
  image_url?: string;
  type?: string;
}

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'besindenetle',
  entities: [Barcode, Product, ProductContent, ContentAnalysis, User, Vote],
  synchronize: false,
});

/** Boş string'i null'a çevir */
const clean = (val: string | undefined): string | null => {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed === '' ? null : trimmed;
};

async function importCsv() {
  // CSV dosya yolunu argümandan al veya default kullan
  const csvFilePath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '../../../../UrunListesi.csv');

  console.log(`📄 CSV okunuyor: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSV dosyası bulunamadı!');
    console.log('Kullanım: pnpm import-csv [csv-dosyası]');
    process.exit(1);
  }

  // Veritabanına bağlan
  try {
    await dataSource.initialize();
    console.log('✅ Veritabanı bağlantısı kuruldu\n');
  } catch (error) {
    console.error('❌ Veritabanı bağlantısı başarısız:', error);
    process.exit(1);
  }

  // CSV'yi oku
  const rows: CsvRow[] = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CsvRow) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 ${rows.length} satır okundu\n`);

  const batchSize = 100;
  let processedCount = 0;
  let createdBarcodeCount = 0;
  let createdProductCount = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    await dataSource.manager.transaction(async (manager) => {
      for (const row of batch) {
        if (!row.barcode) continue;
        const barcodeCode = row.barcode.trim();

        // 1. Barkod var mı kontrol et
        let barcode = await manager.findOne(Barcode, {
          where: { code: barcodeCode },
        });

        if (!barcode) {
          // Yeni barkod oluştur
          barcode = manager.create(Barcode, {
            code: barcodeCode,
            type: row.type ? parseInt(row.type, 10) : 0,
            is_manual: false,
          });
          await manager.save(Barcode, barcode);
          createdBarcodeCount++;
        }

        // 2. Ürün varyantı oluştur
        const product = manager.create(Product, {
          barcode: barcode,
          barcode_id: barcode.id,
          brand: clean(row.brand),
          name: clean(row.name),
          quantity: clean(row.quantity),
          image_url: clean(row.image_url),
          is_manual: false,
        });
        await manager.save(Product, product);
        createdProductCount++;
      }
    });

    processedCount += batch.length;
    if (processedCount % 1000 === 0) {
      console.log(`   İşlenen: ${processedCount} / ${rows.length}`);
    }
  }

  // Özet
  console.log('\n' + '─'.repeat(50));
  console.log('✅ İMPORT TAMAMLANDI!');
  console.log('─'.repeat(50));
  console.log(`   İşlenen Satır:    ${processedCount}`);
  console.log(`   Yeni Barkod:      ${createdBarcodeCount}`);
  console.log(`   Yeni Ürün:        ${createdProductCount}`);
  console.log('─'.repeat(50));

  await dataSource.destroy();
  console.log('\n📤 Veritabanı bağlantısı kapatıldı');
}

importCsv().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
