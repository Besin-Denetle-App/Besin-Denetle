import {
  AuthProvider,
  OAuthRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';

/**
 * OAuth login isteği
 */
export class OAuthRequestDto implements OAuthRequest {
  @ApiProperty({ description: 'OAuth sağlayıcı', enum: AuthProvider })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({ description: 'OAuth token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

/**
 * Kayıt tamamlama isteği
 */
export class RegisterRequestDto implements RegisterRequest {
  @ApiProperty({ description: 'Geçici kayıt token' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({ description: 'Kullanıcı adı' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Kullanım şartları kabul edildi mi' })
  @IsBoolean()
  termsAccepted: boolean;
}

/**
 * Token yenileme isteği
 */
export class RefreshTokenRequestDto implements RefreshTokenRequest {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
