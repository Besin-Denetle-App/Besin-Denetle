import { AuthProvider } from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';

/**
 * OAuth login isteği
 */
export class OAuthRequestDto {
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
export class RegisterRequestDto {
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
export class RefreshTokenRequestDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
