import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { FoodCheckService, RateLimitHelper } from '../../../common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/tokens/jwt-auth.guard';
import { FlagBarcodeRequestDto } from './barcode.dto';
import { BarcodeService } from './barcode.service';

/**
 * Barcode controller - Barkod işlemleri
 */
@ApiTags('barcodes')
@Controller('barcodes')
export class BarcodeController {
  constructor(
    private readonly barcodeService: BarcodeService,
    private readonly rateLimitHelper: RateLimitHelper,
    private readonly foodCheckService: FoodCheckService,
  ) {}

  /**
   * POST /api/barcodes/flag
   * Non-food barkodu bildir
   */
  @Post('flag')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barkodu bildir (non-food)' })
  @ApiResponse({ status: 200, description: 'Bildirim alındı' })
  @ApiResponse({
    status: 400,
    description: 'Gıda ürünleri bildirilemez',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bu barkod zaten gıda kategorisinde',
        error: 'Bad Request',
      },
    },
  })
  async flagBarcode(
    @CurrentUser('id') userId: string,
    @Body() dto: FlagBarcodeRequestDto,
  ): Promise<{ success: boolean }> {
    const { barcodeId } = dto;

    // Rate limit kontrolü
    await this.rateLimitHelper.checkFlag(userId);

    const barcode = await this.barcodeService.findById(barcodeId);
    if (!barcode) {
      throw new NotFoundException('Barkod bulunamadı');
    }

    // Gıda ürünlerinin flag edilmesini engelle
    if (this.foodCheckService.isHumanFoodType(barcode.type)) {
      throw new BadRequestException('Bu barkod zaten gıda kategorisinde');
    }

    // Rate limit sayacını artır
    await this.rateLimitHelper.incrementFlag(userId);

    await this.barcodeService.flag(barcodeId);

    return { success: true };
  }
}
