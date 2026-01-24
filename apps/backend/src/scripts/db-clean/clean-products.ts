/**
 * Ürün Varyantlarını Temizleme Scripti
 * Tüm Product (Varyant) kayıtlarını siler.
 * Cascade ile bağlı ProductContent, ContentAnalysis ve ilişkili Vote kayıtları da silinir.
 * Barcode kayıtları (taban veri) KORUNUR.
 * Kullanım: pnpm db:clean:products
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createInterface } from 'readline';
import { DataSource } from 'typeorm';

// .env dosyasını yükle (root dizinden)
config({ path: resolve(__dirname, '../../../../../.env') });

// Veritabanı bağlantısı oluştur
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'besindenetle',
});

/**
 * Kullanıcıdan onay al
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function deleteProducts() {
  console.log('🗑️  Ürün varyantları (Product) temizleme işlemi başlatıldı...');
  console.log(
    `📦 Veritabanı: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
  console.log('\n⚠️  Bu işlem tüm ürünleri, içerikleri ve analizleri silecek!');
  console.log('ℹ️  Sadece Barkodlar (Barcode) korunacak.\n');

  const startTime = Date.now();

  try {
    // Veritabanına bağlan
    await dataSource.initialize();
    console.log('✅ Veritabanı bağlantısı kuruldu\n');

    // Transaction içinde silme işlemleri
    await dataSource.transaction(async (manager) => {
      // Önce ürün sayısını öğren
      const productCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM product',
      );
      const productCount = parseInt(productCountResult[0].count);

      if (productCount === 0) {
        console.log('ℹ️  Silinecek ürün bulunamadı.');
        return;
      }

      console.log(`📊 Toplam ${productCount} ürün varyantı bulundu`);

      // İçerik sayısını öğren
      const contentCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM product_content',
      );
      const contentCount = parseInt(contentCountResult[0].count);
      console.log(
        `📊 ${contentCount} içerik varyantı bulundu (cascade ile silinecek)`,
      );

      // İlişkili analizleri say
      const analysisCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM content_analysis',
      );
      const analysisCount = parseInt(analysisCountResult[0].count);
      console.log(
        `📊 ${analysisCount} analiz varyantı bulundu (cascade ile silinecek)`,
      );

      // İlişkili oyları say (tüm product, content, analysis oyları)
      const voteCountResult = await manager.query<{ count: string }[]>(
        `SELECT COUNT(*) as count FROM vote 
         WHERE product_id IS NOT NULL 
            OR product_content_id IS NOT NULL 
            OR content_analysis_id IS NOT NULL`,
      );
      const voteCount = parseInt(voteCountResult[0].count);
      console.log(`📊 ${voteCount} oy bulundu (cascade ile silinecek)\n`);

      // Production kontrolü
      if (process.env.NODE_ENV === 'production') {
        console.log(
          '⚠️  Production ortamında çalışıyorsunuz! Ekstra dikkatli olun.',
        );
      }

      // Kullanıcıdan onay al
      console.log('⚠️  UYARI: Bu işlem GERİ ALINAMAZ!');
      console.log(`   - ${productCount} ürün varyantı silinecek`);
      console.log(
        `   - ${contentCount} içerik ve ${analysisCount} analiz CASCADE ile silinecek`,
      );
      console.log(`   - ${voteCount} oy CASCADE ile silinecek`);
      console.log('   - Sadece Barkodlar (Barcode) KORUNACAK\n');

      const confirmed = await askConfirmation(
        'Devam etmek istediğinize EMİN misiniz? (yes/no): ',
      );

      if (!confirmed) {
        console.log('\n❌ İşlem iptal edildi.');
        return;
      }

      console.log('\n🔄 Silme işlemi başlıyor...');

      // Tüm ürünleri sil (CASCADE ile içerik, analiz ve oylar da silinir)
      await manager.query('DELETE FROM product');

      console.log(`✅ ${productCount} ürün varyantı silindi`);
      console.log(
        '✅ İlişkili tüm içerik, analiz ve oylar cascade ile silindi',
      );
    });

    // Özet
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log('✅ ÜRÜN VARYANTLARI TEMİZLEME TAMAMLANDI!');
    console.log('='.repeat(50));
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
deleteProducts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
