import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsUUID()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsEnum(MessageType, { message: 'Geçerli bir mesaj tipi seçin' })
  type?: MessageType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
