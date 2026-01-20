import {
  OAuthResponse,
  RefreshTokenResponse,
  RegisterResponse,
} from '@besin-denetle/shared';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Request,
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
} from '../../common/rate-limit';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  EmailSignupRequestDto,
  OAuthRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user?: { id: string };
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  /** Cloudflare uyumlu IP alma */
  private getClientIp(req: AuthenticatedRequest): string {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) {
      return Array.isArray(cfIp) ? cfIp[0] : cfIp;
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ip.split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OAuth ile giriş' })
  @ApiResponse({
    status: 200,
    description: 'Login başarılı veya tempToken döner',
  })
  async oauth(
    @Request() req: AuthenticatedRequest,
    @Body() dto: OAuthRequestDto,
  ): Promise<OAuthResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = this.getClientIp(req);

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
    @Request() req: AuthenticatedRequest,
    @Body() dto: EmailSignupRequestDto,
  ): Promise<OAuthResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = this.getClientIp(req);

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

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Kayıt tamamla' })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı' })
  async register(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RegisterRequestDto,
  ): Promise<RegisterResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = this.getClientIp(req);

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
    @Request() req: AuthenticatedRequest,
    @Body() dto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponse> {
    const authConfig =
      this.configService.get<RateLimitAuthConfig>('rateLimit.auth')!;
    const clientIp = this.getClientIp(req);

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

    await this.authService.deleteAccount(userId);
    return {
      success: true,
      message: 'Hesabınız başarıyla silindi',
    };
  }
}
