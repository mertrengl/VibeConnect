import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Kullanıcı adı boş bırakılamaz.' })
  @IsString()
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır.' })
  @MaxLength(50, { message: 'Kullanıcı adı en fazla 50 karakter olmalıdır.' })
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir.',
  })
  username!: string;

  @IsEmail({}, { message: 'Lütfen geçerli bir email adresi girin.' })
  email!: string;

  @IsNotEmpty({ message: 'Şifre alanı boş bırakılamaz.' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])/, {
    message:
      'Şifre en az 1 büyük harf, 1 küçük harf ve 1 özel sembol içermelidir.',
  })
  @MaxLength(128, { message: 'Şifre en fazla 128 karakter olmalıdır.' })
  password!: string;
}
