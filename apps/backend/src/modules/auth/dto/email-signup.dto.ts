import { EmailAuthRequest } from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

/**
 * E-posta ile kayıt isteği DTO
 * Beta test için kullanılır - Sadece Gmail kabul edilir
 */
export class EmailSignupRequestDto implements EmailAuthRequest {
  @ApiProperty({
    description: 'E-posta adresi (sadece @gmail.com)',
    example: 'kullanici@gmail.com',
  })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @IsNotEmpty({ message: 'E-posta adresi zorunludur' })
  @Matches(/@gmail\.com$/i, {
    message: 'Şu an sadece Gmail adresleri kabul edilmektedir',
  })
  email: string;
}
