/**
 * Kullanıcıları Silme Scripti
 * Tüm kullanıcıları ve ilişkili verilerini (oylar) cascade olarak siler.
 * Kullanım: pnpm db:clean:users
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

async function deleteUsers() {
  console.log('🗑️  Kullanıcı silme işlemi başlatıldı...');
  console.log(
    `📦 Veritabanı: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
  console.log('\n⚠️  Bu işlem tüm kullanıcıları ve ilişkili oyları silecek!');

  const startTime = Date.now();

  try {
    // Veritabanına bağlan
    await dataSource.initialize();
    console.log('✅ Veritabanı bağlantısı kuruldu\n');

    // Transaction içinde silme işlemleri
    await dataSource.transaction(async (manager) => {
      // Önce kullanıcı sayısını öğren
      const userCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM users',
      );
      const userCount = parseInt(userCountResult[0].count);

      if (userCount === 0) {
        console.log('ℹ️  Silinecek kullanıcı bulunamadı.');
        return;
      }

      console.log(`📊 Toplam ${userCount} kullanıcı bulundu`);

      // Oyları say (cascade ile silinecek)
      const voteCountResult = await manager.query<{ count: string }[]>(
        'SELECT COUNT(*) as count FROM vote WHERE user_id IS NOT NULL',
      );
      const voteCount = parseInt(voteCountResult[0].count);
      console.log(`📊 Bu kullanıcılara ait ${voteCount} oy bulundu\n`);

      // Production kontrolü
      if (process.env.NODE_ENV === 'production') {
        console.log(
          '⚠️  Production ortamında çalışıyorsunuz! Ekstra dikkatli olun.',
        );
      }

      // Kullanıcıdan onay al
      console.log('⚠️  UYARI: Bu işlem GERİ ALINAMAZ!');
      console.log(`   - ${userCount} kullanıcı silinecek`);
      console.log(`   - ${voteCount} oy cascade ile silinecek\n`);

      const confirmed = await askConfirmation(
        'Devam etmek istediğinize emin misiniz? (yes/no): ',
      );

      if (!confirmed) {
        console.log('\n❌ İşlem iptal edildi.');
        return;
      }

      console.log('\n🔄 Silme işlemi başlıyor...');

      // Tüm kullanıcıları sil (CASCADE ile oylar da silinir)
      await manager.query('DELETE FROM users');

      console.log(`✅ ${userCount} kullanıcı silindi`);
      console.log(`✅ ${voteCount} oy cascade ile silindi`);
    });

    // Özet
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log('✅ KULLLANICI SİLME İŞLEMİ TAMAMLANDI!');
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
deleteUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
