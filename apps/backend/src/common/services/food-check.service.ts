import { ProductType } from '@besin-denetle/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AppLogger } from '../logger';

// Güvenlik context'i
// Bypass denemeleri loglamak için
export interface SecurityContext {
  userId?: string;
  action?: string;
  resourceId?: string;
}

// Barkod tipinin insan gıdası olup olmadığını kontrol eden servis
@Injectable()
export class FoodCheckService {
  constructor(private readonly appLogger: AppLogger) {}

  // İnsan gıdası kontrolü yapar
  // Gıda değilse BadRequestException fırlatır ve güvenlik logu yazar
  assertHumanFood(
    barcodeType: number | undefined,
    context?: SecurityContext,
  ): void {
    if (barcodeType === undefined || barcodeType === null) {
      return; // Barkod bilgisi yoksa kontrolü atla
    }

    const isHumanFood =
      barcodeType === Number(ProductType.FOOD) ||
      barcodeType === Number(ProductType.BEVERAGE);

    if (!isHumanFood) {
      // Güvenlik logu yaz
      if (context) {
        this.appLogger.security('Non-food bypass attempt', {
          userId: context.userId || 'unknown',
          action: context.action || 'unknown',
          barcodeType,
          resourceId: context.resourceId || 'N/A',
        });
      }
      throw new BadRequestException(
        'Bu ürün yiyecek/içecek kategorisinde değil',
      );
    }
  }

  // Gıda mı diye kontrol et
  // Exception fırlatmaz, sadece boolean döner
  isHumanFoodType(barcodeType: number | undefined): boolean {
    if (barcodeType === undefined || barcodeType === null) {
      return false;
    }
    return (
      barcodeType === Number(ProductType.FOOD) ||
      barcodeType === Number(ProductType.BEVERAGE)
    );
  }
}
