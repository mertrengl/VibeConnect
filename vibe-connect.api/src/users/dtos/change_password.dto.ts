import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Eski şifre boş bırakılamaz.' })
  oldPassword!: string;

  @IsNotEmpty({ message: 'Şifre alanı boş bırakılamaz.' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])/, {
    message:
      'Şifre en az 1 büyük harf, 1 küçük harf ve 1 özel sembol içermelidir.',
  })
  @MaxLength(128, { message: 'Şifre en fazla 128 karakter olmalıdır.' })
  newPassword!: string;
}
