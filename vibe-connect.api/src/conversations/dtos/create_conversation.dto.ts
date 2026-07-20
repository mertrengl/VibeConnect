import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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
}
