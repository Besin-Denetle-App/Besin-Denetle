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

async function analyzeCsv() {
  // Correct path to the CSV file in the root directory
  const csvFilePath = path.resolve(
    __dirname,
    '../../../../Ürün Listesi (14.442) .csv',
  );
  console.log(`Reading CSV from: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found!');
    return;
  }

  const results: any[] = [];
  const barcodes = new Set<string>();
  let duplicateBarcodesInCsv = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: any) => {
        results.push(data);
        if (data.barcode) {
          const trimmed = data.barcode.trim();
          if (barcodes.has(trimmed)) {
            duplicateBarcodesInCsv++;
            console.log(
              `[Duplicate] Barcode: ${trimmed} | Name: ${data.name} | Row: ${JSON.stringify(data)}`,
            );
          }
          barcodes.add(trimmed);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('------------------------------------------------');
  console.log(`Total Rows in CSV: ${results.length}`);
  console.log(`Unique Barcodes in CSV: ${barcodes.size}`);
  console.log(`Duplicate Barcodes in CSV: ${duplicateBarcodesInCsv}`);

  // Connect to DB
  try {
    await dataSource.initialize();
    console.log('Database connected.');

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

    console.log(
      `Existing Barcodes in DB (out of CSV unique ones): ${existingCount}`,
    );
    console.log(
      `New Barcodes to be created: ${barcodeList.length - existingCount}`,
    );
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

analyzeCsv();
