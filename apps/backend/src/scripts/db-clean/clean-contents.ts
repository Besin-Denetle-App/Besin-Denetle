/**
 * İçerik Varyantlarını Temizleme Scripti
 * Tüm ProductContent kayıtlarını siler.
 * Cascade ile bağlı ContentAnalysis kayıtları da silinir.
 * Ürünler korunur, sadece içerik ve analiz verileri silinir.
 * Kullanım: pnpm db:clean:contents
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

async function deleteContents() {
  console.log('🗑️  İçerik varyantları temizleme işlemi başlatıldı...');
  console.log(
    `📦 Veritabanı: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
  console.log('\n⚠️  Bu işlem tüm içerikleri ve analizleri silecek!');
  console.log('ℹ️  Ürünler (Product) ve barkodlar korunacak.\n');

  const startTime = Date.now();

  try {
    // Veritabanına bağlan
    await dataSource.initialize();
    console.log('✅ Veritabanı bağlantısı kuruldu\n');

    // Transaction içinde silme işlemleri
    await dataSource.transaction(async (manager) => {
      // Önce içerik sayısını öğren
      const contentCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM product_content',
      );
      const contentCount = parseInt(contentCountResult[0].count);

      if (contentCount === 0) {
        console.log('ℹ️  Silinecek içerik bulunamadı.');
        return;
      }

      console.log(`📊 Toplam ${contentCount} içerik varyantı bulundu`);

      // İlişkili analizleri say (cascade ile silinecek)
      const analysisCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM content_analysis',
      );
      const analysisCount = parseInt(analysisCountResult[0].count);
      console.log(
        `📊 ${analysisCount} analiz varyantı bulundu (cascade ile silinecek)`,
      );

      // İlişkili oyları say (cascade ile silinecek)
      const contentVoteResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM vote WHERE product_content_id IS NOT NULL',
      );
      const contentVoteCount = parseInt(contentVoteResult[0].count);

      const analysisVoteResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM vote WHERE content_analysis_id IS NOT NULL',
      );
      const analysisVoteCount = parseInt(analysisVoteResult[0].count);

      const totalVoteCount = contentVoteCount + analysisVoteCount;
      console.log(
        `📊 ${totalVoteCount} oy bulundu (${contentVoteCount} içerik + ${analysisVoteCount} analiz)\n`,
      );

      // Production kontrolü
      if (process.env.NODE_ENV === 'production') {
        console.log(
          '⚠️  Production ortamında çalışıyorsunuz! Ekstra dikkatli olun.',
        );
      }

      // Kullanıcıdan onay al
      console.log('⚠️  UYARI: Bu işlem GERİ ALINAMAZ!');
      console.log('   Bu script EN TEHLİKELİ temizleme scriptidir!');
      console.log(`   - ${contentCount} içerik varyantı silinecek`);
      console.log(`   - ${analysisCount} analiz CASCADE ile silinecek`);
      console.log(`   - ${totalVoteCount} oy CASCADE ile silinecek`);
      console.log('   - Ürünler ve barkodlar KORUNACAK\n');

      const confirmed = await askConfirmation(
        'Devam etmek istediğinize EMİN misiniz? (yes/no): ',
      );

      if (!confirmed) {
        console.log('\n❌ İşlem iptal edildi.');
        return;
      }

      console.log('\n🔄 Silme işlemi başlıyor...');

      // Tüm içerikleri sil (CASCADE ile analizler ve oylar da silinir)
      await manager.query('DELETE FROM product_content');

      console.log(`✅ ${contentCount} içerik varyantı silindi`);
      if (analysisCount > 0) {
        console.log(`✅ ${analysisCount} analiz cascade ile silindi`);
      }
      if (totalVoteCount > 0) {
        console.log(`✅ ${totalVoteCount} oy cascade ile silindi`);
      }
    });

    // Özet
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log('✅ İÇERİK VARYANTLARI TEMİZLEME TAMAMLANDI!');
    console.log('='.repeat(50));
    console.log(`   ${'Süre'.padEnd(16)} ${duration}ms`);
    console.log('='.repeat(50));
    console.log('\nℹ️  İpucu: Skorları yeniden hesaplamak için:');
    console.log('   pnpm recalculate');
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
deleteContents().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
