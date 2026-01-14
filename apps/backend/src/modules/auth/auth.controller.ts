import {
  OAuthResponse,
  RefreshTokenResponse,
  RegisterResponse,
} from '@besin-denetle/shared';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  EmailSignupRequestDto,
  OAuthRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * JWT ile doğrulanmış kullanıcı içeren request
 */
interface AuthenticatedRequest {
  user?: { id: string };
}

/**
 * Auth Controller
 * OAuth, register, refresh, logout endpoint'leri
 *
 * Rate Limiting:
 * - oauth, register: 5/dk (IP bazlı, brute-force koruması)
 * - refresh, logout: 20/dk (User bazlı)
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/oauth
   * OAuth token gönder, login veya tempToken al
   * Rate Limit: 5/dk (IP bazlı - brute-force koruması)
   */
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'OAuth ile giriş' })
  @ApiResponse({
    status: 200,
    description: 'Login başarılı veya tempToken döner',
  })
  async oauth(@Body() dto: OAuthRequestDto): Promise<OAuthResponse> {
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

  /**
   * POST /api/auth/email-signup
   * E-posta ile kayıt/login (Beta test için)
   * Kayıtlı kullanıcı varsa JWT döner, yoksa tempToken ile kayıt akışı başlatır
   * Rate Limit: 5/dk (IP bazlı - brute-force koruması)
   */
  @Post('email-signup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'E-posta ile kayıt/login (Beta)' })
  @ApiResponse({
    status: 200,
    description: 'Login başarılı veya tempToken döner',
  })
  async emailSignup(
    @Body() dto: EmailSignupRequestDto,
  ): Promise<OAuthResponse> {
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

  /**
   * POST /api/auth/register
   * Kayıt tamamla, JWT al
   * Rate Limit: 5/dk (IP bazlı - brute-force koruması)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Kayıt tamamla' })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı' })
  async register(@Body() dto: RegisterRequestDto): Promise<RegisterResponse> {
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

  /**
   * POST /api/auth/refresh
   * JWT yenile
   * Rate Limit: 20/dk (User bazlı)
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Token yenile' })
  @ApiResponse({ status: 200, description: 'Yeni token döner' })
  async refresh(
    @Body() dto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponse> {
    const tokens = await this.authService.refreshTokens(dto.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * POST /api/auth/logout
   * Çıkış (client-side token silme)
   * Rate Limit: 20/dk (User bazlı)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çıkış yap' })
  @ApiResponse({ status: 200, description: 'Çıkış başarılı' })
  logout(@Request() req: AuthenticatedRequest): {
    message: string;
    userId: string;
  } {
    // Token blacklist uygulanabilir (opsiyonel)
    return {
      message: 'Çıkış başarılı',
      userId: req.user?.id ?? '',
    };
  }
}
