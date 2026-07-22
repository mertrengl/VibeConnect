import { IsEnum, IsNotEmpty } from 'class-validator';
import { ParticipantRole } from '@prisma/client';

export class UpdateParticipantRoleDto {
  @IsEnum(ParticipantRole, { message: 'Geçersiz rol' })
  @IsNotEmpty({ message: 'Rol boş olamaz' })
  role!: ParticipantRole;
}
