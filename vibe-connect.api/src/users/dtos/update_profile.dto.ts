import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Kullanıcı adı boş bırakılamaz.' })
  @IsString()
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır.' })
  @MaxLength(50, { message: 'Kullanıcı adı en fazla 50 karakter olmalıdır.' })
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir.',
  })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Lütfen geçerli bir email adresi girin.' })
  email?: string;
}
