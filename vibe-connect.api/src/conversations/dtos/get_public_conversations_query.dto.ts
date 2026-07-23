import { GroupCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetPublicConversationsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(GroupCategory, { message: 'Geçerli bir kategori seçin' })
  category?: GroupCategory;
}
