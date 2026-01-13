import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Barcode } from '../entities/barcode.entity';
import { ContentAnalysis } from '../entities/content-analysis.entity';
import { ProductContent } from '../entities/product-content.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';

// CSV row tip tanımı
interface CsvRow {
  barcode?: string;
  name?: string;
  brand?: string;
  quantity?: string;
  image_url?: string;
  type?: string;
}

// Simple .env loader
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath).toString();
  envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
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

async function importCsv() {
  const csvFilePath = path.resolve(
    __dirname,
    '../../../../Ürün Listesi (14.442) .csv',
  );
  console.log(`Starting Import from: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found!');
    return;
  }

  // Connect to DB
  try {
    await dataSource.initialize();
    console.log('Database connected.');
  } catch (error) {
    console.error('Database connection failed:', error);
    return;
  }

  const rows: CsvRow[] = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CsvRow) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Read ${rows.length} rows from CSV.`);

  // Helper to clean CSV values (trim whitespace, convert empty strings to null)
  const clean = (val: string | undefined): string | null => {
    if (!val) return null;
    // csv-parser handles quotes automatically, but we trim extra whitespace
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  };

  const batchSize = 100;
  let processedCount = 0;
  let createdBarcodeCount = 0;
  let createdProductCount = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    await dataSource.manager.transaction(async (transactionalEntityManager) => {
      for (const row of batch) {
        if (!row.barcode) continue;
        const barcodeCode = row.barcode.trim();

        // 1. Check if Barcode exists
        let barcode = await transactionalEntityManager.findOne(Barcode, {
          where: { code: barcodeCode },
        });

        if (!barcode) {
          // Create new Barcode
          barcode = transactionalEntityManager.create(Barcode, {
            code: barcodeCode,
            type: row.type ? parseInt(row.type, 10) : 0, // Default to 0 if missing
            is_manual: false, // Imported data is NOT manual
          });
          await transactionalEntityManager.save(Barcode, barcode);
          createdBarcodeCount++;
        }

        // 2. Create Product (Variant)
        const product = transactionalEntityManager.create(Product, {
          barcode: barcode,
          barcode_id: barcode.id,
          brand: clean(row.brand),
          name: clean(row.name),
          quantity: clean(row.quantity),
          image_url: clean(row.image_url),
          is_manual: false, // Imported data is NOT manual
        });

        await transactionalEntityManager.save(Product, product);
        createdProductCount++;
      }
    });

    processedCount += batch.length;
    if (processedCount % 1000 === 0) {
      console.log(`Processed ${processedCount} / ${rows.length} rows...`);
    }
  }

  console.log('------------------------------------------------');
  console.log('Import Completed Successfully!');
  console.log(`Total Rows Processed: ${processedCount}`);
  console.log(`Created Barcodes: ${createdBarcodeCount}`);
  console.log(`Created Products: ${createdProductCount}`);

  await dataSource.destroy();
}

void importCsv();
