import { OAuthResponse } from '@besin-denetle/shared';
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
import { EmailSignupRequestDto, OAuthRequestDto } from '../dto';

/**
 * Login endpoint'leri - OAuth ve Email ile giriş
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthLoginController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OAuth ile giriş' })
  @ApiResponse({
    status: 200,
    description: 'Login başarılı veya tempToken döner',
  })
  async oauth(
    @Req() req: Request,
    @Body() dto: OAuthRequestDto,
  ): Promise<OAuthResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = getClientIp(req);

    await this.rateLimitService.checkIpLimit(
      RateLimitKeyPrefix.AUTH_OAUTH,
      clientIp,
      authConfig.oauth_ip,
      'auth_oauth',
    );

    await this.rateLimitService.incrementIpLimit(
      RateLimitKeyPrefix.AUTH_OAUTH,
      clientIp,
      authConfig.oauth_ip,
    );

    const result = await this.authService.validateOAuth(
      dto.provider,
      dto.token,
    );

    if (result.isNewUser) {
      return {
        isNewUser: true,
        tempToken: result.tempToken!,
        message: 'Kayıt tamamlanmalı',
      };
    }

    return {
      isNewUser: false,
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken!,
      user: {
        id: result.user!.id,
        username: result.user!.username,
        email: result.user!.email,
        role: result.user!.role,
      },
    };
  }

  @Post('email-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'E-posta ile kayıt/login (Beta)' })
  @ApiResponse({
    status: 200,
    description: 'Login başarılı veya tempToken döner',
  })
  async emailSignup(
    @Req() req: Request,
    @Body() dto: EmailSignupRequestDto,
  ): Promise<OAuthResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = getClientIp(req);

    await this.rateLimitService.checkIpLimit(
      RateLimitKeyPrefix.AUTH_EMAIL_SIGNUP,
      clientIp,
      authConfig.email_signup_ip,
      'auth_email_signup',
    );

    await this.rateLimitService.incrementIpLimit(
      RateLimitKeyPrefix.AUTH_EMAIL_SIGNUP,
      clientIp,
      authConfig.email_signup_ip,
    );

    const result = await this.authService.validateEmailSignup(dto.email);

    if (result.isNewUser) {
      return {
        isNewUser: true,
        tempToken: result.tempToken!,
        message: 'Kayıt tamamlanmalı',
      };
    }

    return {
      isNewUser: false,
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken!,
      user: {
        id: result.user!.id,
        username: result.user!.username,
        email: result.user!.email,
        role: result.user!.role,
      },
    };
  }
}
