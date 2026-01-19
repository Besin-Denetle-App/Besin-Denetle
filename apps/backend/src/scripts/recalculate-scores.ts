/**
 * Manuel Skor Yeniden Hesaplama Scripti
 * Kullanım: pnpm recalculate-scores
 */

import { VoteType } from '@besin-denetle/shared';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// .env dosyasını yükle
config();

// Veritabanı bağlantısı oluştur
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'besindenetle',
});

/** Güncelleme sonucu */
interface UpdateResult {
  name: string;
  count: number;
}

/**
 * Skor güncelleme SQL'i
 */
async function updateTableScores(
  dataSource: DataSource,
  tableName: string,
  tableAlias: string,
  voteColumn: string,
): Promise<number> {
  const result = await dataSource.query<{ id: string }[]>(`
    UPDATE ${tableName} ${tableAlias}
    SET 
      score = COALESCE((
        SELECT SUM(CASE WHEN v.vote_type = '${VoteType.UP}' THEN 1 ELSE -1 END)
        FROM vote v
        WHERE v.${voteColumn} = ${tableAlias}.id
      ), 0),
      vote_count = COALESCE((
        SELECT COUNT(*)
        FROM vote v
        WHERE v.${voteColumn} = ${tableAlias}.id
      ), 0)
    RETURNING id
  `);
  return (result as { id: string }[]).length;
}

async function recalculateScores() {
  console.log('🔄 Skor yeniden hesaplama başlatıldı...');
  console.log(
    `📦 Veritabanı: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );

  const startTime = Date.now();
  const results: UpdateResult[] = [];

  try {
    // Veritabanına bağlan
    await dataSource.initialize();
    console.log('✅ Veritabanı bağlantısı kuruldu\n');

    // Transaction içinde tüm güncellemeleri yap
    await dataSource.transaction(async () => {
      // 1. Product skorları
      console.log('📊 Product skorları hesaplanıyor...');
      const productCount = await updateTableScores(
        dataSource,
        'product',
        'p',
        'product_id',
      );
      results.push({ name: 'Product', count: productCount });
      console.log(`   → ${productCount} ürün güncellendi`);

      // 2. ProductContent skorları
      console.log('📊 ProductContent skorları hesaplanıyor...');
      const contentCount = await updateTableScores(
        dataSource,
        'product_content',
        'pc',
        'product_content_id',
      );
      results.push({ name: 'ProductContent', count: contentCount });
      console.log(`   → ${contentCount} içerik güncellendi`);

      // 3. ContentAnalysis skorları
      console.log('📊 ContentAnalysis skorları hesaplanıyor...');
      const analysisCount = await updateTableScores(
        dataSource,
        'content_analysis',
        'ca',
        'content_analysis_id',
      );
      results.push({ name: 'ContentAnalysis', count: analysisCount });
      console.log(`   → ${analysisCount} analiz güncellendi`);
    });

    // Özet
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log('✅ SKOR YENİDEN HESAPLAMA TAMAMLANDI!');
    console.log('='.repeat(50));
    for (const r of results) {
      console.log(`   ${r.name.padEnd(16)} ${r.count} kayıt`);
    }
    console.log(`   ${'Süre'.padEnd(16)} ${duration}ms`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  } finally {
    // Bağlantıyı kapat
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n📤 Veritabanı bağlantısı kapatıldı');
    }
  }
}

// Scripti çalıştır
recalculateScores().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
