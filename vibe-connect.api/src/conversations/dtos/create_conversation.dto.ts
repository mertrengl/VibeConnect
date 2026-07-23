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
import { Transform } from 'class-transformer';
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
  @Transform(
    ({ obj, value }: { obj: Record<string, boolean>; value?: boolean }) =>
      value ?? obj?.is_group,
  )
  isGroup?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({ obj, value }: { obj: Record<string, boolean>; value?: boolean }) =>
      value ?? obj?.is_public,
  )
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Açıklama en fazla 255 karakter olabilir.' })
  description?: string;

  @IsOptional()
  @IsEnum(GroupCategory, { message: 'Geçersiz grup kategorisi.' })
  category?: GroupCategory;
}
