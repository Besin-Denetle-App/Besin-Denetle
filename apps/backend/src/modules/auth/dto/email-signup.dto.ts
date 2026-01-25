import { EmailAuthRequest } from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Matches, MaxLength } from 'class-validator';

/** Beta test için - sadece Gmail kabul edilir */
export class EmailSignupRequestDto implements EmailAuthRequest {
  @ApiProperty({
    description: 'E-posta adresi (sadece @gmail.com)',
    example: 'kullanici@gmail.com',
  })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @IsNotEmpty({ message: 'E-posta adresi zorunludur' })
  @MaxLength(100, { message: 'E-posta adresi çok uzun' })
  @Matches(/@gmail\.com$/i, {
    message: 'Şu an sadece Gmail adresleri kabul edilmektedir',
  })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;
}
