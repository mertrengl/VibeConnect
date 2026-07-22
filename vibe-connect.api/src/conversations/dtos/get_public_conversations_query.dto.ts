import { IsOptional, IsString } from 'class-validator';

export class GetPublicConversationsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
