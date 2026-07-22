import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteMessageQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  forEveryone?: boolean = false;
}
