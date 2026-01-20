import {
  AuthProvider,
  OAuthRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class OAuthRequestDto implements OAuthRequest {
  @ApiProperty({ description: 'OAuth sağlayıcı', enum: AuthProvider })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({ description: 'OAuth token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RegisterRequestDto implements RegisterRequest {
  @ApiProperty({ description: 'Geçici kayıt token' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({
    description: 'Kullanıcı adı (3-20 karakter, harf/rakam/alt çizgi)',
    minLength: 3,
    maxLength: 20,
    example: 'kullanici_adi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kullanıcı adı boş olamaz' })
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalı' })
  @MaxLength(20, { message: 'Kullanıcı adı en fazla 20 karakter olabilir' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir',
  })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  username: string;

  @ApiProperty({ description: 'Kullanım şartları kabul edildi mi' })
  @IsBoolean()
  termsAccepted: boolean;
}

export class RefreshTokenRequestDto implements RefreshTokenRequest {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
