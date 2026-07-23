import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { GroupCategory } from '@prisma/client';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  participantIds!: string[];

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Açıklama en fazla 255 karakter olabilir.' })
  description?: string;

  @IsOptional()
  @IsEnum([GroupCategory], { message: 'Geçersiz grup kategorisi.' })
  category?: GroupCategory;
}
