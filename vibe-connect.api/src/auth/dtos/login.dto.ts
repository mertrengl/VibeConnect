import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Kullanıcı adı veya email boş bırakılamaz.' })
  @IsString()
  usernameOrEmail!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
  })
  password!: string;

  //Beni hatırla özelliği ekledim.Frontend tarafında rememberMe özelliği true ise token 6 ay değilse 1 gün olarak ayarlayacağız.
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
