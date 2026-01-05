# @besin-denetle/shared

Bu paket, **Backend** ve **Mobile** uygulamaları arasında paylaşılan ortak kodları içerir. Kod tekrarını önlemek ve tip güvenliğini (type safety) sağlamak amacıyla oluşturulmuştur.

## 📦 İçerik

- **DTOs (Data Transfer Objects):** API veri alışverişinde kullanılan şemalar.
- **Types/Interfaces:** Veritabanı modelleri ve genel tip tanımları.
- **Enums:** Ortak sabit değerler (örn: `UserRole`, `VoteType`).
- **Utilities:** Yardımcı fonksiyonlar (örn: tarih formatlama, string işlemleri).

## 🚀 Kullanım

Bu paket monorepo içerisindeki diğer projeler tarafından doğrudan import edilebilir:

```typescript
import { ProductDto } from '@besin-denetle/shared';
import { UserRole } from '@besin-denetle/shared';
```

## ⚠️ Geliştirme Notları

Bu pakette yapılan değişiklikler, bağımlı olan `apps/backend` ve `apps/mobile` projelerinde anında etkili olur. TypeScript derleyicisi değişiklikleri otomatik olarak algılayacaktır.