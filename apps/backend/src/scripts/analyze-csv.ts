/**
 * CSV Analiz Scripti
 * Kullanım: pnpm analyze-csv [csv-dosyası]
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

// .env dosyasını yükle (root dizinden)
config({ path: path.resolve(__dirname, '../../../../.env') });

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

async function analyzeCsv() {
  // CSV dosya yolunu argümandan al veya scripts klasöründen UrunListesi.csv kullan
  const csvFilePath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, 'UrunListesi.csv');

  console.log(`📄 CSV okunuyor: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSV dosyası bulunamadı!');
    console.log('Kullanım: pnpm analyze-csv [csv-dosyası]');
    process.exit(1);
  }

  const results: CsvRow[] = [];
  const barcodes = new Set<string>();
  let duplicateCount = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CsvRow) => {
        results.push(data);
        if (data.barcode) {
          const trimmed = data.barcode.trim();
          if (barcodes.has(trimmed)) {
            duplicateCount++;
          }
          barcodes.add(trimmed);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('─'.repeat(50));
  console.log(`📊 CSV Özeti:`);
  console.log(`   Toplam Satır:     ${results.length}`);
  console.log(`   Tekil Barkod:     ${barcodes.size}`);
  console.log(`   Tekrarlı Barkod:  ${duplicateCount}`);

  // Veritabanı karşılaştırması
  try {
    await dataSource.initialize();
    console.log('\n✅ Veritabanı bağlantısı kuruldu');

    const barcodeList = Array.from(barcodes);
    const chunkSize = 1000;
    let existingCount = 0;

    for (let i = 0; i < barcodeList.length; i += chunkSize) {
      const chunk = barcodeList.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;

      const count = await dataSource
        .getRepository(Barcode)
        .createQueryBuilder('barcode')
        .where('barcode.code IN (:...codes)', { codes: chunk })
        .getCount();
      existingCount += count;
    }

    console.log('─'.repeat(50));
    console.log(`📊 Veritabanı Karşılaştırması:`);
    console.log(`   Mevcut Barkod:    ${existingCount}`);
    console.log(`   Yeni Barkod:      ${barcodeList.length - existingCount}`);
    console.log('─'.repeat(50));
  } catch (error) {
    console.error('❌ Veritabanı hatası:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('📤 Veritabanı bağlantısı kapatıldı');
    }
  }
}

analyzeCsv().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
