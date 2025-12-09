import { BarcodeStatus } from '@besin-denetle/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { BarcodeService } from '../barcode/barcode.service';
import { ContentAnalysis } from '../entities/content-analysis.entity';
import { ProductContent } from '../entities/product-content.entity';
import { Product } from '../entities/product.entity';
import { ConfirmProductDto, ScanProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductContent)
    private contentRepo: Repository<ProductContent>,
    @InjectRepository(ContentAnalysis)
    private analysisRepo: Repository<ContentAnalysis>,
    private barcodeService: BarcodeService,
    private aiService: AiService,
    private dataSource: DataSource,
  ) {}

  async scan(dto: ScanProductDto) {
    // 1. Barkod Kontrolü (DB'de var mı?)
    let barcode = await this.barcodeService.findByCode(dto.barcode);
    
    // Durum 1: Barkod VAR ve AKTİF (Status = 1)
    // Bu durumda veritabanındaki kayıtlı ürünü ve en popüler içeriği döndürürüz.
    if (barcode && barcode.status === BarcodeStatus.ACTIVE) {
        // Detaylı ürün verisini çek (İçerikler ve Analizlerle birlikte)
        const product = await this.productRepo.findOne({
            where: { barcodeId: barcode.id },
            relations: ['contents', 'contents.analyses']
        });
        
        if (product) {
             // En yüksek skorlu içeriği bul (Basit bir sıralama)
             const bestContent = product.contents.sort((a,b) => b.score - a.score)[0];
             return {
                 status: 'EXISTING',
                 product,
                 displayedContent: bestContent,
             };
        }
    }

    // Durum 2: Barkod REDDEDİLMİŞ (Status = 2)
    // Daha önce bu barkodun besin olmadığı teyit edilmiş.
    if (barcode && barcode.status === BarcodeStatus.REJECTED) {
        return { status: 'REJECTED', message: 'Bu ürün besin değil olarak işaretlenmiş.' };
    }

    // Durum 3: Barkod YOK veya BEKLEMEDE (Status = 0)
    // AI devreye girer.
    
    // Eğer barkod hiç yoksa, geçici (Pending) olarak oluştur.
    if (!barcode) {
        barcode = await this.barcodeService.findOrCreate(dto.barcode);
    }

    // AI Analizi Başlat (Google Gemini)
    const aiResult = await this.aiService.analyzeProductImage(dto.imageBase64);

    // AI "Bu besin değil" dediyse:
    if (!aiResult.isFood) {
        // İleride burada kullanıcıya sorarak teyit alabiliriz.
        // Şimdilik AI sonucunu dönüyoruz.
        return { status: 'NOT_FOOD_DETECTED', aiResult };
    }

    // AI başarıyla analiz ettiyse verileri onaya sun:
    return {
        status: 'NEW_DETECTED',
        data: aiResult 
    };
  }

  async confirm(dto: ConfirmProductDto) {
    const barcode = await this.barcodeService.findByCode(dto.barcode);
    if (!barcode) {
        throw new NotFoundException('Barkod bulunamadı');
    }

    // Transaction Başlat (Tüm veriler ya hep ya hiç mantığıyla kaydedilmeli)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 1. Ürünü Oluştur (Product Tablosu)
        const product = this.productRepo.create({
            barcodeId: barcode.id,
            name: dto.product.name,
            brand: dto.product.brand,
            quantity: dto.product.quantity,
            isManual: false, // AI onaylı veri
        });
        const savedProduct = await queryRunner.manager.save(product);

        // 2. İçeriği Oluştur (ProductContent Tablosu)
        const content = this.contentRepo.create({
            productId: savedProduct.id,
            ingredients: dto.content.ingredients,
            allergens: dto.content.allergens,
            nutritionTable: dto.content.nutrition,
            score: 0,
            isManual: false,
        });
        const savedContent = await queryRunner.manager.save(content);

        // 3. Analizi Oluştur (ContentAnalysis Tablosu)
        if (dto.analysis) {
            const analysis = this.analysisRepo.create({
                productContentId: savedContent.id,
                analysisText: dto.analysis,
                score: 0,
                isManual: false,
            });
            await queryRunner.manager.save(analysis);
        }

        // 4. Barkod Durumunu Güncelle (PENDING -> ACTIVE)
        barcode.status = BarcodeStatus.ACTIVE;
        await queryRunner.manager.save(barcode);

        // Hata yoksa onayla
        await queryRunner.commitTransaction();

        return { success: true, productId: savedProduct.id };

    } catch (err) {
        // Hata varsa her şeyi geri al
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
  }
}
