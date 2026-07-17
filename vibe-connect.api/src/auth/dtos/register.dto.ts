import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Kullanıcı adı boş bırakılamaz.' })
  @IsString()
  username: string;

  @IsEmail({}, { message: 'Lütfen geçerli bir email adresi girin.' })
  email: string;

  @IsNotEmpty({ message: 'Şifre alanı boş bırakılamaz.' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])/, {
    message:
      'Şifre en az 1 büyük harf, 1 küçük harf ve 1 özel sembol içermelidir.',
  })
  password: string;
}
