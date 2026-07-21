import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class GetMessagesQueryDto {
  @IsOptional()
  @IsUUID(4, { message: 'Geçersiz ID tipi girdiniz.' })
  cursor?: string;

  @IsOptional()
  @Type(() => Number) //String olarak gelen sayısal değeri number tipine dönüştürmek için kullanılır.
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
