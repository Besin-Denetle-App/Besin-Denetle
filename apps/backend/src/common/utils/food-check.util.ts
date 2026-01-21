import { ProductType } from '@besin-denetle/shared';
import { BadRequestException, Logger } from '@nestjs/common';

/**
 * Security logger instance
 * NOTE: Utility function olduğu için AppLogger inject edilemiyor
 * Static logger kullanıyoruz
 */
const securityLogger = new Logger('Security');

/**
 * Güvenlik context'i - bypass denemeleri loglamak için
 */
export interface SecurityContext {
    userId?: string;
    action?: string;
    resourceId?: string;
}

/**
 * Barkod tipinin insan gıdası olup olmadığını kontrol eder.
 * Non-food ürünler için BadRequestException fırlatır ve güvenlik logu yazar.
 *
 * @param barcodeType - Barkod tipi (0=kararsız, 1=yiyecek, 2=içecek, 3=evcil, 9=diğer)
 * @param context - Opsiyonel güvenlik context'i (loglama için)
 * @throws BadRequestException - Gıda değilse
 */
export function assertHumanFood(
    barcodeType: number | undefined,
    context?: SecurityContext,
): void {
    if (barcodeType === undefined || barcodeType === null) {
        return; // Barkod bilgisi yoksa kontrolü atla
    }

    const isHumanFood =
        barcodeType === ProductType.FOOD || barcodeType === ProductType.BEVERAGE;

    if (!isHumanFood) {
        // Güvenlik logu structured format
        if (context) {
            securityLogger.warn('Non-food bypass attempt', {
                userId: context.userId || 'unknown',
                action: context.action || 'unknown',
                barcodeType,
                resourceId: context.resourceId || 'N/A',
                category: 'security',
            });
        }
        throw new BadRequestException('Bu ürün yiyecek/içecek kategorisinde değil');
    }
}

/**
 * Barkod tipinin insan gıdası olup olmadığını döner.
 * Exception fırlatmaz, sadece boolean döner.
 */
export function isHumanFoodType(barcodeType: number | undefined): boolean {
    if (barcodeType === undefined || barcodeType === null) {
        return false;
    }
    return (
        barcodeType === ProductType.FOOD || barcodeType === ProductType.BEVERAGE
    );
}
