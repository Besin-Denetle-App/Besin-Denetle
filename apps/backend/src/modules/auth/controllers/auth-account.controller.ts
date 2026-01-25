import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  RateLimitAuthConfig,
  RateLimitKeyPrefix,
  RateLimitService,
} from '../../../common/rate-limit';

import { AuthService } from '../auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../tokens/jwt-auth.guard';
import { UserService } from '../user.service';

/**
 * Hesap yönetimi endpoint'leri - Korumalı (JWT gerekli)
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthAccountController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çıkış yap' })
  @ApiResponse({ status: 200, description: 'Çıkış başarılı' })
  async logout(@CurrentUser('id') userId: string): Promise<{
    message: string;
    userId: string;
  }> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;

    await this.rateLimitService.checkUserLimit(
      RateLimitKeyPrefix.AUTH_LOGOUT,
      userId,
      authConfig.logout_user,
      'auth_logout',
    );

    await this.rateLimitService.incrementUserLimit(
      RateLimitKeyPrefix.AUTH_LOGOUT,
      userId,
      authConfig.logout_user,
    );

    return {
      message: 'Çıkış başarılı',
      userId: userId,
    };
  }

  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hesabı kalıcı olarak sil' })
  @ApiResponse({ status: 200, description: 'Hesap silindi' })
  async deleteAccount(
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;

    await this.rateLimitService.checkUserLimit(
      RateLimitKeyPrefix.AUTH_DELETE,
      userId,
      authConfig.delete_user,
      'auth_delete',
    );

    await this.rateLimitService.incrementUserLimit(
      RateLimitKeyPrefix.AUTH_DELETE,
      userId,
      authConfig.delete_user,
    );

    await this.userService.deleteAccount(userId);
    return {
      success: true,
      message:
        "Hesabınız silinmek üzere işaretlendi. Gece 01:00'de kalıcı olarak silinecek.",
    };
  }

  @Post('restore-account')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Silinme sürecindeki hesabı geri yükle' })
  @ApiResponse({ status: 200, description: 'Hesap geri yüklendi' })
  async restoreAccount(
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.userService.restoreAccount(userId);
    return {
      success: true,
      message: 'Hesabınız başarıyla geri yüklendi',
    };
  }
}
