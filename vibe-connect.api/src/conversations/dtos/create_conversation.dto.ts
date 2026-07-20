import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';
export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  participantIds!: string[];

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;
}
