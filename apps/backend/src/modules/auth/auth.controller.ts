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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
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
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/oauth
   * OAuth token gönder, login veya tempToken al
   */
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
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
   */
  @Post('email-signup')
  @HttpCode(HttpStatus.OK)
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
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
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
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
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
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
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

  /**
   * DELETE /api/auth/delete-account
   * Hesabı kalıcı olarak sil
   */
  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hesabı kalıcı olarak sil' })
  @ApiResponse({ status: 200, description: 'Hesap silindi' })
  async deleteAccount(
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.authService.deleteAccount(userId);
    return {
      success: true,
      message: 'Hesabınız başarıyla silindi',
    };
  }
}
