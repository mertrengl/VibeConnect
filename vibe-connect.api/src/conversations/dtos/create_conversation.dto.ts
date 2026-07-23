import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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

  // Frontend 'is_group' yollarsa da ValidationPipe engellemesin!
  @IsBoolean()
  @IsOptional()
  is_group?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  // Frontend 'is_public' yollarsa da ValidationPipe engellemesin!
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Açıklama en fazla 255 karakter olabilir.' })
  description?: string;

  @IsOptional()
  @IsEnum(GroupCategory, { message: 'Geçersiz grup kategorisi.' })
  category?: GroupCategory;
}
