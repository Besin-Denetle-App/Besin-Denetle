/**
 * Analiz Varyantlarını Temizleme Scripti
 * Tüm ContentAnalysis kayıtlarını siler.
 * Ürünler ve içerikler korunur, sadece AI analizleri silinir.
 * Kullanım: pnpm db:clean:analyses
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

async function deleteAnalyses() {
  console.log('🗑️  Analiz varyantları temizleme işlemi başlatıldı...');
  console.log(
    `📦 Veritabanı: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
  console.log('\n⚠️  Bu işlem tüm AI analizlerini silecek!');
  console.log('ℹ️  Ürünler ve içerikler korunacak.\n');

  const startTime = Date.now();

  try {
    // Veritabanına bağlan
    await dataSource.initialize();
    console.log('✅ Veritabanı bağlantısı kuruldu\n');

    // Transaction içinde silme işlemleri
    await dataSource.transaction(async (manager) => {
      // Önce analiz sayısını öğren
      const analysisCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM content_analysis',
      );
      const analysisCount = parseInt(analysisCountResult[0].count);

      if (analysisCount === 0) {
        console.log('ℹ️  Silinecek analiz bulunamadı.');
        return;
      }

      console.log(`📊 Toplam ${analysisCount} analiz varyantı bulundu`);

      // İlişkili oyları say (cascade ile silinecek)
      const voteCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM vote WHERE content_analysis_id IS NOT NULL',
      );
      const voteCount = parseInt(voteCountResult[0].count);
      console.log(
        `📊 Bu analizlere ait ${voteCount} oy bulundu (cascade ile silinecek)\n`,
      );

      // Production kontrolü
      if (process.env.NODE_ENV === 'production') {
        console.log(
          '⚠️  Production ortamında çalışıyorsunuz! Ekstra dikkatli olun.',
        );
      }

      // Kullanıcıdan onay al
      console.log('⚠️  UYARI: Bu işlem GERİ ALINAMAZ!');
      console.log(`   - ${analysisCount} analiz varyantı silinecek`);
      console.log(`   - ${voteCount} oy cascade ile silinecek`);
      console.log('   - Ürünler ve içerikler KORUNACAK\n');

      const confirmed = await askConfirmation(
        'Devam etmek istediğinize emin misiniz? (yes/no): ',
      );

      if (!confirmed) {
        console.log('\n❌ İşlem iptal edildi.');
        return;
      }

      console.log('\n🔄 Silme işlemi başlıyor...');

      // Tüm analizleri sil (CASCADE ile ilişkili oylar da silinir)
      await manager.query('DELETE FROM content_analysis');

      console.log(`✅ ${analysisCount} analiz varyantı silindi`);
      if (voteCount > 0) {
        console.log(`✅ ${voteCount} oy cascade ile silindi`);
      }
    });

    // Özet
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log('✅ ANALİZ VARYANTLARI TEMİZLEME TAMAMLANDI!');
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
deleteAnalyses().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
