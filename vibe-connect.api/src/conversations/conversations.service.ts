import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { GroupCategory, ParticipantRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dtos/create_conversation.dto';
import { MarkAsReadDto } from './dtos/mark_as_read.dto';
import { AddParticipantDto } from './dtos/add_participant.dto';
import { UpdateParticipantRoleDto } from './dtos/update_participant_role.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { ErrorCodes } from '../common/constants/error_codes';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    return await this.prisma.$transaction(async (tx) => {
      const allParticipantIds = [userId, ...dto.participantIds];
      if (new Set(allParticipantIds).size !== allParticipantIds.length) {
        throw new BadRequestException({
          code: ErrorCodes.ALREADY_GROUP_PARTICIPANT,
          message: 'Bir kullanıcı konuşmaya yalnızca bir kez eklenebilir.',
        });
      }

      const existingUsers = await tx.users.findMany({
        where: {
          id: { in: allParticipantIds },
        },
        select: { id: true },
      });

      if (existingUsers.length !== allParticipantIds.length) {
        throw new NotFoundException({
          code: ErrorCodes.USER_NOT_FOUND,
          message: 'Bir veya daha fazla kullanıcı bulunamadı.',
        });
      }

      const isGroupVal = dto.isGroup ?? dto.is_group ?? false;
      const isPublicVal = dto.isPublic ?? dto.is_public ?? false;

      if (isGroupVal && allParticipantIds.length < 3) {
        throw new BadRequestException({
          code: ErrorCodes.GROUP_MIN_PARTICIPANTS_REQUIRED,
          message: 'Bir grup oluşturmak için kurucu dahil en az 3 katılımcı olmalıdır.',
        });
      }

      if (!isGroupVal) {
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
          description: dto.description,
          category: dto.category ?? 'GENERAL',
          is_group: true,
          is_public: isPublicVal,
        },
      });
      await tx.participants.createMany({
        data: allParticipantIds.map((pId) => ({
          conversation_id: conversation.id,
          user_id: pId,
          role: pId === userId ? ParticipantRole.OWNER : ParticipantRole.MEMBER,
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
        avatar_url: convo.avatar_url,
        isGroup: convo.is_group,
        created_at: convo.created_at,
        category: convo.category,
        description: convo.description,
        last_message_at: convo.last_message_at,
        participantCount: convo.participants.length + 1,
        myRole: p.role,
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
      throw new NotFoundException({
        code: ErrorCodes.NOT_CONVERSATION_PARTICIPANT,
        message: 'Kullanıcı bu konuşmanın bir katılımcısı değil.',
      });
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
      throw new NotFoundException({
        code: ErrorCodes.CONVERSATION_NOT_FOUND,
        message: 'Konuşma bulunamadı.',
      });
    }
    const isParticipant = conversation.participants.some(
      (p) => p.user_id === userId,
    );
    if (!isParticipant) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_CONVERSATION_PARTICIPANT,
        message: 'Kullanıcı bu konuşmanın bir katılımcısı değil.',
      });
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
      throw new NotFoundException({
        code: ErrorCodes.CONVERSATION_NOT_FOUND,
        message: 'Konuşma bulunamadı.',
      });
    }

    if (!conversation.is_group) {
      throw new BadRequestException({
        code: ErrorCodes.NOT_GROUP_CONVERSATION,
        message: 'Bu konuşma bir grup konuşması değil.',
      });
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
      throw new BadRequestException({
        code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
        message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.',
      });
    }

    const targetUser = await this.prisma.users.findUnique({
      where: { id: dto.targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'Hedef kullanıcı bulunamadı.',
      });
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
      throw new BadRequestException({
        code: ErrorCodes.ALREADY_GROUP_PARTICIPANT,
        message: 'Kullanıcı zaten konuşmada mevcut.',
      });
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
      throw new BadRequestException({
        code: ErrorCodes.NOT_GROUP_CONVERSATION,
        message: 'Geçersiz konuşma.',
      });
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
      throw new NotFoundException({
        code: ErrorCodes.NOT_CONVERSATION_PARTICIPANT,
        message: 'Katılımcı bulunamadı.',
      });
    }

    const isSelf = currentUserId === targetUserId;

    if (!isSelf) {
      if (currentParticipant.role === ParticipantRole.MEMBER) {
        throw new ForbiddenException({
          code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
          message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.',
        });
      }

      if (
        currentParticipant.role === ParticipantRole.ADMIN &&
        targetParticipant.role !== ParticipantRole.MEMBER
      ) {
        throw new ForbiddenException({
          code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
          message: 'Bir yönetici yalnızca normal üyeleri konuşmadan çıkarabilir.',
        });
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
      throw new BadRequestException({
        code: ErrorCodes.NOT_GROUP_CONVERSATION,
        message: 'Geçersiz grup konuşması.',
      });
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
      throw new ForbiddenException({
        code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
        message: 'Sadece grup sahibi üye rollerini değiştirebilir.',
      });
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
      throw new NotFoundException({
        code: ErrorCodes.NOT_CONVERSATION_PARTICIPANT,
        message: 'Hedef kullanıcı grupta bulunamadı.',
      });
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
  async getPublicConversations(
    userId: string,
    query?: string,
    category?: GroupCategory,
  ) {
    return await this.prisma.conversations.findMany({
      where: {
        is_group: true,
        is_public: true,
        ...(category && { category }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
        participants: {
          where: { user_id: userId },
          select: { role: true },
        },
      },
      orderBy: {
        last_message_at: 'desc',
      },
      take: 20,
    });
  }

  async joinPublicConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.is_group) {
      throw new NotFoundException({
        code: ErrorCodes.CONVERSATION_NOT_FOUND,
        message: 'Grup bulunamadı.',
      });
    }
    if (!conversation.is_public) {
      throw new ForbiddenException({
        code: ErrorCodes.GROUP_NOT_PUBLIC,
        message: 'Bu grup konuşması herkese açık değil.',
      });
    }
    const existingParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (existingParticipant) {
      throw new ConflictException({
        code: ErrorCodes.ALREADY_GROUP_PARTICIPANT,
        message: 'Zaten bu gruba katılmışsınız.',
      });
    }

    return await this.prisma.participants.create({
      data: {
        conversation_id: conversationId,
        user_id: userId,
        role: ParticipantRole.MEMBER,
      },
      include: {
        conversations: true,
      },
    });
  }

  async leaveConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.is_group) {
      throw new NotFoundException({
        code: ErrorCodes.CONVERSATION_NOT_FOUND,
        message: 'Grup bulunamadı.',
      });
    }

    const participant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_CONVERSATION_PARTICIPANT,
        message: 'Bu grubun bir üyesi değilsiniz.',
      });
    }

    if (participant.role === ParticipantRole.OWNER) {
      const otherParticipantsCount = await this.prisma.participants.count({
        where: {
          conversation_id: conversationId,
          user_id: { not: userId },
        },
      });

      if (otherParticipantsCount > 0) {
        throw new BadRequestException({
          code: ErrorCodes.CANNOT_LEAVE_AS_OWNER,
          message: 'Grup sahibi gruptan ayrılamaz. Önce sahipliği devretmeli veya grubu silmelisiniz.',
        });
      }

      return await this.prisma.conversations.delete({
        where: { id: conversationId },
      });
    }

    return await this.prisma.participants.delete({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });
  }

  async updateGroupAvatar(
    conversationId: string,
    currentUserId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCodes.FILE_REQUIRED,
        message: 'Avatar dosyası sağlanmadı.',
      });
    }
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.is_group) {
      throw new BadRequestException({
        code: ErrorCodes.NOT_GROUP_CONVERSATION,
        message: 'Geçersiz grup konuşması.',
      });
    }

    const currentParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: currentUserId,
        },
      },
    });

    if (
      !currentParticipant ||
      currentParticipant.role === ParticipantRole.MEMBER
    ) {
      throw new ForbiddenException({
        code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
        message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.',
      });
    }

    const uploadResult = (await this.cloudinaryService.uploadFile(
      file,
      'vibeconnect_group_avatars',
    )) as Record<string, any>;

    const avatarUrl = String(uploadResult.secure_url || uploadResult.url || '');

    return await this.prisma.conversations.update({
      where: { id: conversationId },
      data: { avatar_url: avatarUrl },
    });
  }

  async removeGroupAvatar(conversationId: string, currentUserId: string) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.is_group) {
      throw new BadRequestException({
        code: ErrorCodes.NOT_GROUP_CONVERSATION,
        message: 'Geçersiz grup konuşması.',
      });
    }

    const currentParticipant = await this.prisma.participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: currentUserId,
        },
      },
    });

    if (
      !currentParticipant ||
      currentParticipant.role === ParticipantRole.MEMBER
    ) {
      throw new ForbiddenException({
        code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
        message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.',
      });
    }

    return await this.prisma.conversations.update({
      where: { id: conversationId },
      data: { avatar_url: null },
    });
  }
}
