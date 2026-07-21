import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchConversationsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @MinLength(3)
  q!: string;
}
