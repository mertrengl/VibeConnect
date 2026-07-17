import { Injectable } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsArray } from 'class-validator/types/decorator/typechecker/IsArray';

@Injectable()
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
