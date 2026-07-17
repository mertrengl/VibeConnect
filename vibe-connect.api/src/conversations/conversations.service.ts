import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dtos/create_conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    return await this.prisma.$transaction(async (tx) => {
      const allParticipantIds = [userId, ...dto.participantIds];
      const existingUsers = await tx.users.findMany({
        where: {
          id: { in: allParticipantIds },
        },
        select: { id: true },
      });

      if (existingUsers.length !== allParticipantIds.length) {
        throw new Error('Bir veya daha fazla kullanıcı bulunamadı.');
      }
      const conversation = await tx.conversations.create({
        data: {
          name: dto.name,
          is_group: dto.isGroup || false,
        },
      });
      await tx.participants.createMany({
        data: allParticipantIds.map((pId) => ({
          conversation_id: conversation.id,
          user_id: pId,
          role: dto.isGroup && pId === userId ? 'Admin' : 'Member',
        })),
      });
      return conversation;
    });
  }
}
