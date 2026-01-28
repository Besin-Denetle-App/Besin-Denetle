import { RefreshTokenResponse, RegisterResponse } from '@besin-denetle/shared';
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import {
    getClientIp,
    RateLimitAuthConfig,
    RateLimitKeyPrefix,
    RateLimitService,
} from '../../../common';

import { AuthService } from '../auth.service';
import { RefreshTokenRequestDto, RegisterRequestDto } from '../dto';

/**
 * Kayıt ve token yenileme endpoint'leri
 */
@ApiTags('auth')
@Controller('auth')
export class AuthRegisterController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Kayıt tamamla' })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı' })
  async register(
    @Req() req: Request,
    @Body() dto: RegisterRequestDto,
  ): Promise<RegisterResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = getClientIp(req);

    await this.rateLimitService.checkIpLimit(
      RateLimitKeyPrefix.AUTH_REGISTER,
      clientIp,
      authConfig.register_ip,
      'auth_register',
    );

    await this.rateLimitService.incrementIpLimit(
      RateLimitKeyPrefix.AUTH_REGISTER,
      clientIp,
      authConfig.register_ip,
    );

    const result = await this.authService.completeRegistration(
      dto.tempToken,
      dto.username,
      dto.termsAccepted,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Token yenile' })
  @ApiResponse({ status: 200, description: 'Yeni token döner' })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = getClientIp(req);

    await this.rateLimitService.checkIpLimit(
      RateLimitKeyPrefix.AUTH_REFRESH,
      clientIp,
      authConfig.refresh_ip,
      'auth_refresh',
    );

    await this.rateLimitService.incrementIpLimit(
      RateLimitKeyPrefix.AUTH_REFRESH,
      clientIp,
      authConfig.refresh_ip,
    );

    const tokens = await this.authService.refreshTokens(dto.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
