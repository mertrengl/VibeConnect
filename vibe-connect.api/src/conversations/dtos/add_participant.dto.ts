import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddParticipantDto {
  @IsUUID(4, { message: 'Geçersiz ID formatı' })
  @IsNotEmpty({ message: 'ID boş olamaz' })
  targetUserId!: string;
}
