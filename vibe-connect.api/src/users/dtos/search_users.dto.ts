import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @MinLength(3)
  q!: string;
}
