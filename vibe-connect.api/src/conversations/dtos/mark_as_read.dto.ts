import { IsUUID, IsNotEmpty } from 'class-validator';

export class MarkAsReadDto {
  @IsNotEmpty({ message: 'Bu alan boş bırakılamaz.' })
  @IsUUID(4, { message: 'Geçersiz UUID formatı.' })
  lastReadMessageId!: string;
}
