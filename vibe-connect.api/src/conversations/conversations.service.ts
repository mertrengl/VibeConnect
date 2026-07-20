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

  async getUserConversations(userId: string) {
    const userParticipants = await this.prisma.participants.findMany({
      where: { user_id: userId },
      include: {
        conversations: {
          include: {
            participants: {
              where: { user_id: { not: userId } },
              include: {
                users: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversations: { created_at: 'desc' },
      },
    });

    return userParticipants.map((p) => {
      const convo = p.conversations;
      let displayName = convo.name;

      if (!convo.is_group && !displayName) {
        const otherParticipant = convo.participants[0];
        if (otherParticipant && otherParticipant.users) {
          displayName = otherParticipant.users.username;
        }
      }

      return {
        id: convo.id,
        name: displayName,
        isGroup: convo.is_group,
        createdAt: convo.created_at,
        otherUser:
          !convo.is_group && convo.participants[0]
            ? convo.participants[0].users
            : null,
      };
    });
  }
}
