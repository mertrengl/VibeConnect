import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ParticipantRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dtos/create_conversation.dto';
import { MarkAsReadDto } from './dtos/mark_as_read.dto';
import { AddParticipantDto } from './dtos/add_participant.dto';
import { UpdateParticipantRoleDto } from './dtos/update_participant_role.dto';
@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    return await this.prisma.$transaction(async (tx) => {
      const allParticipantIds = [userId, ...dto.participantIds];
      if (new Set(allParticipantIds).size !== allParticipantIds.length) {
        throw new BadRequestException(
          'Bir kullanıcı konuşmaya yalnızca bir kez eklenebilir.',
        );
      }

      const existingUsers = await tx.users.findMany({
        where: {
          id: { in: allParticipantIds },
        },
        select: { id: true },
      });

      if (existingUsers.length !== allParticipantIds.length) {
        throw new NotFoundException(
          'Bir veya daha fazla kullanıcı bulunamadı.',
        );
      }

      if (!dto.isGroup) {
        const [smallerId, largerId] = [userId, dto.participantIds[0]].sort();

        const existingDM = await tx.direct_messages_mapping.findUnique({
          where: {
            user1_id_user2_id: {
              user1_id: smallerId,
              user2_id: largerId,
            },
          },
          include: {
            conversations: true,
          },
        });
        if (existingDM) {
          return existingDM.conversations;
        }
        const conversation = await tx.conversations.create({
          data: {
            is_group: false,
            name: null,
          },
        });
        await tx.direct_messages_mapping.create({
          data: {
            user1_id: smallerId,
            user2_id: largerId,
            conversation_id: conversation.id,
          },
        });
        await tx.participants.createMany({
          data: allParticipantIds.map((pId) => ({
            conversation_id: conversation.id,
            user_id: pId,
            role: ParticipantRole.MEMBER,
          })),
        });
        return conversation;
      }
      const conversation = await tx.conversations.create({
        data: {
          name: dto.name,
          is_group: dto.isGroup ?? false,
        },
      });
      await tx.participants.createMany({
        data: allParticipantIds.map((pId) => ({
          conversation_id: conversation.id,
          user_id: pId,
          role:
            dto.isGroup && pId === userId
              ? ParticipantRole.OWNER
              : ParticipantRole.MEMBER,
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
        conversations: { last_message_at: 'desc' },
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
        created_at: convo.created_at,
        otherUser:
          !convo.is_group && convo.participants[0]
            ? convo.participants[0].users
            : null,
      };
    });
  }
  async searchConversations(userId: string, query: string) {
    return await this.prisma.conversations.findMany({
      where: {
        is_group: true,
        name: { contains: query, mode: 'insensitive' },
        participants: {
          some: { user_id: userId },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        last_message_at: 'desc',
      },
      take: 20,
    });
  }
  async markAsRead(conversationId: string, userId: string, dto: MarkAsReadDto) {
    const participant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException(
        'Kullanıcı bu konuşmanın bir katılımcısı değil.',
      );
    }
    return await this.prisma.participants.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: {
        last_read_message_id: dto.lastReadMessageId,
      },
    });
  }
  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            users: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Konuşma bulunamadı.');
    }
    const isParticipant = conversation.participants.some(
      (p) => p.user_id === userId,
    );
    if (!isParticipant) {
      throw new NotFoundException(
        'Kullanıcı bu konuşmanın bir katılımcısı değil.',
      );
    }
    return conversation;
  }

  async addParticipants(
    conversationID: string,
    currentUserId: string,
    dto: AddParticipantDto,
  ) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationID },
    });

    if (!conversation) {
      throw new NotFoundException('Konuşma bulunamadı.');
    }

    if (!conversation.is_group) {
      throw new BadRequestException('Bu konuşma bir grup konuşması değil.');
    }

    const currentParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: currentUserId,
        },
      },
    });

    if (
      !currentParticipant ||
      currentParticipant.role === ParticipantRole.MEMBER
    ) {
      throw new BadRequestException(
        'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.',
      );
    }

    const targetUser = await this.prisma.users.findUnique({
      where: { id: dto.targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Hedef kullanıcı bulunamadı.');
    }

    const existingParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: dto.targetUserId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('Kullanıcı zaten konuşmada mevcut.');
    }

    return await this.prisma.participants.create({
      data: {
        conversation_id: conversationID,
        user_id: dto.targetUserId,
        role: ParticipantRole.MEMBER,
      },
      include: {
        users: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async deleteParticipant(
    conversationID: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationID },
    });

    if (!conversation || !conversation.is_group) {
      throw new BadRequestException('Geçersiz konuşma.');
    }

    const currentParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: currentUserId,
        },
      },
    });

    const targetParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: targetUserId,
        },
      },
    });

    if (!currentParticipant || !targetParticipant) {
      throw new NotFoundException('Katılımcı bulunamadı.');
    }

    const isSelf = currentUserId === targetUserId;

    if (!isSelf) {
      if (currentParticipant.role === ParticipantRole.MEMBER) {
        throw new ForbiddenException(
          'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.',
        );
      }

      if (
        currentParticipant.role === ParticipantRole.ADMIN &&
        targetParticipant.role !== ParticipantRole.MEMBER
      ) {
        throw new ForbiddenException(
          'Bir yönetici yalnızca normal üyeleri konuşmadan çıkarabilir.',
        );
      }
    }

    return await this.prisma.participants.delete({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: targetUserId,
        },
      },
    });
  }

  async updateParticipantRole(
    conversationID: string,
    currentUserId: string,
    targetUserId: string,
    dto: UpdateParticipantRoleDto,
  ) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationID },
    });

    if (!conversation || !conversation.is_group) {
      throw new BadRequestException('Geçersiz grup konuşması.');
    }

    const currentParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: currentUserId,
        },
      },
    });

    if (
      !currentParticipant ||
      currentParticipant.role !== ParticipantRole.OWNER
    ) {
      throw new ForbiddenException(
        'Sadece grup sahibi üye rollerini değiştirebilir.',
      );
    }

    const targetParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: targetUserId,
        },
      },
    });

    if (!targetParticipant) {
      throw new NotFoundException('Hedef kullanıcı grupta bulunamadı.');
    }

    return await this.prisma.participants.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationID,
          user_id: targetUserId,
        },
      },
      data: {
        role: dto.role,
      },
    });
  }
}
