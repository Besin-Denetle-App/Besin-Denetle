# Database Temizleme Scriptleri

Bu klasördeki scriptler, veritabanındaki verileri kontrollü bir şekilde temizlemek için kullanılır. Her script **cascade** silme yapar ve işlem öncesi **onay ister**.

## 1. Analizleri Sil (`clean-analyses.ts`)

**Komut:** `pnpm db:clean:analyses`

- **Etkisi:** Sadece AI tarafından üretilen analizleri (`content_analysis`) ve bunlara ait oyları siler.
- **Korunan:** Ürünler ve içerik metinleri silinmez.

## 2. İçerikleri Sil (`clean-contents.ts`)

**Komut:** `pnpm db:clean:contents`

- **Etkisi:** Ürün içeriklerini (`product_content`), bunlara bağlı analizleri ve tüm ilgili oyları siler.
- **Korunan:** Sadece temel ürün (`product`) ve barkod (`barcode`) kayıtları kalır.

## 3. Kullanıcıları Sil (`clean-users.ts`)

**Komut:** `pnpm db:clean:users`

- **Etkisi:** Tüm kullanıcıları ve onlara ait oyları siler.
- **Korunan:** Ürünler, içerikler ve analizler silinmez.
- **Kullanım:** Test kullanıcılarını temizlemek için.

> ⚠️ **Güvenlik Korumaları:**
>
> - Tüm scriptler Production ortamında (`NODE_ENV=production`) **EKSTRA UYARI** verir.
> - Tüm scriptler işlem öncesi "yes" yazarak manuel onay ister.
>
> 💡 Temizleme sonrası skorları güncellemek için `pnpm db:recalculate` çalıştırılması önerilir.
