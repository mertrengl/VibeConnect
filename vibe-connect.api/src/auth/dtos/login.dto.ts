import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Kullanıcı adı veya email boş bırakılamaz.' })
  @IsString()
  usernameOrEmail!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password!: string;

  //Beni hatırla özelliği ekledim.Frontend tarafında rememberMe özelliği true ise token 6 ay değilse 1 gün olarak ayarlayacağız.
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
