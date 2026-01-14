/**
 * Manuel Skor Yeniden Hesaplama Scripti
 *
 * Kullanım: pnpm recalculate-scores
 *
 * Bu script, Vote tablosundaki oylardan tüm skorları yeniden hesaplar.
 * Kullanıcı silindikten sonra veya veri tutarsızlığı olduğunda kullanılır.
 */

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

async function recalculateScores() {
  console.log('🔄 Skor yeniden hesaplama başlatıldı...');
  console.log(
    `📦 Veritabanı: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );

  const startTime = Date.now();

  try {
    // Veritabanına bağlan
    await dataSource.initialize();
    console.log('✅ Veritabanı bağlantısı kuruldu');

    // 1. Product skorlarını yeniden hesapla
    console.log('\n📊 Product skorları hesaplanıyor...');
    const productResult = await dataSource.query<{ id: string }[]>(`
      UPDATE product p
      SET 
        score = COALESCE((
          SELECT SUM(CASE WHEN v.vote_type = 'UP' THEN 1 ELSE -1 END)
          FROM vote v
          WHERE v.product_id = p.id
        ), 0),
        vote_count = COALESCE((
          SELECT COUNT(*)
          FROM vote v
          WHERE v.product_id = p.id
        ), 0)
      RETURNING id
    `);
    console.log(
      `   → ${(productResult as { id: string }[]).length} ürün güncellendi`,
    );

    // 2. ProductContent skorlarını yeniden hesapla
    console.log('\n📊 ProductContent skorları hesaplanıyor...');
    const contentResult = await dataSource.query<{ id: string }[]>(`
      UPDATE product_content pc
      SET 
        score = COALESCE((
          SELECT SUM(CASE WHEN v.vote_type = 'UP' THEN 1 ELSE -1 END)
          FROM vote v
          WHERE v.product_content_id = pc.id
        ), 0),
        vote_count = COALESCE((
          SELECT COUNT(*)
          FROM vote v
          WHERE v.product_content_id = pc.id
        ), 0)
      RETURNING id
    `);
    console.log(
      `   → ${(contentResult as { id: string }[]).length} içerik güncellendi`,
    );

    // 3. ContentAnalysis skorlarını yeniden hesapla
    console.log('\n📊 ContentAnalysis skorları hesaplanıyor...');
    const analysisResult = await dataSource.query<{ id: string }[]>(`
      UPDATE content_analysis ca
      SET 
        score = COALESCE((
          SELECT SUM(CASE WHEN v.vote_type = 'UP' THEN 1 ELSE -1 END)
          FROM vote v
          WHERE v.content_analysis_id = ca.id
        ), 0),
        vote_count = COALESCE((
          SELECT COUNT(*)
          FROM vote v
          WHERE v.content_analysis_id = ca.id
        ), 0)
      RETURNING id
    `);
    console.log(
      `   → ${(analysisResult as { id: string }[]).length} analiz güncellendi`,
    );

    // Özet
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log('✅ SKOR YENİDEN HESAPLAMA TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(
      `   Product:         ${(productResult as { id: string }[]).length} kayıt`,
    );
    console.log(
      `   ProductContent:  ${(contentResult as { id: string }[]).length} kayıt`,
    );
    console.log(
      `   ContentAnalysis: ${(analysisResult as { id: string }[]).length} kayıt`,
    );
    console.log(`   Süre:            ${duration}ms`);
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
