import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ToggleReactionDto {
  @IsNotEmpty({ message: 'Emoji alanı boş bırakılamaz.' })
  @IsString()
  @MaxLength(20, { message: 'Geçersiz emoji formatı.' })
  emoji!: string;
}
