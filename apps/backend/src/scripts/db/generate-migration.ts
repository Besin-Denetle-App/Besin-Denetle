import { execSync } from 'child_process';
import * as readline from 'readline';

const run = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    console.log('\n--- Yeni Migration Oluşturucu ---\n');
    let migrationName = process.argv[2];

    if (!migrationName) {
      migrationName = await question(
        ' Migration ismi nedir? (Örn: CreateUserTable): ',
      );
    }

    if (!migrationName.trim()) {
      console.error(' İsim boş olamaz!');
      process.exit(1);
    }

    // Boşlukları ve özel karakterleri temizle
    const cleanName = migrationName.trim().replace(/[^a-zA-Z0-9]/g, '');
    const migrationPath = `src/migrations/${cleanName}`;

    console.log(`\n Migration oluşturuluyor: ${migrationPath}...\n`);

    const command = `pnpm typeorm migration:generate -d src/data-source.ts ${migrationPath}`;

    // Komutu çalıştır
    execSync(command, { stdio: 'inherit' });

    console.log('\n✅ İşlem tamamlandı! Migration dosyası oluşturuldu.');
  } catch {
    console.error(
      "\n❌ Bir hata oluştu. Lütfen Docker'ın çalıştığından ve veritabanı bağlantısının olduğundan emin olun.",
    );
  } finally {
    rl.close();
  }
};

void run();
