import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dtos/create_message.dto';
import { UpdateMessageDto } from './dtos/update_message.dto';
import { ParticipantRole } from '@prisma/client';
import { GetMessagesQueryDto } from './dtos/get_messages_query.dto';
import { DeleteMessageQueryDto } from './dtos/delete_message_query.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(dto: CreateMessageDto, userId: string) {
    const isParticipant = await this.prisma.participants.findFirst({
      where: {
        conversation_id: dto.conversationId,
        user_id: userId,
      },
    });
    if (!isParticipant) {
      throw new ForbiddenException('Bu konuşmaya mesaj gönderme yetkiniz yok.');
    }
    const message = await this.prisma.messages.create({
      data: {
        conversation_id: dto.conversationId,
        sender_id: userId,
        content: dto.content,
      },
    });
    return message;
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    dto: GetMessagesQueryDto,
  ) {
    const isParticipant = await this.prisma.participants.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId,
      },
    });
    if (!isParticipant) {
      throw new ForbiddenException('Bu konuşmaya erişim yetkiniz yok.');
    }
    return await this.prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
        message_deletions: {
          none: {
            user_id: userId,
          },
        },
      },
      ...(dto.cursor && {
        cursor: { id: dto.cursor },
        skip: 1,
      }),
      take: -(dto.limit ?? 20),
      orderBy: {
        created_at: 'asc',
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async updateMessage(
    messageId: string,
    dto: UpdateMessageDto,
    userId: string,
  ) {
    const message = await this.prisma.messages.findUnique({
      where: {
        id: messageId,
      },
    });
    if (!message) {
      throw new ForbiddenException('Mesaj bulunamadı.');
    }
    if (message.sender_id !== userId) {
      throw new ForbiddenException('Bu mesajı güncelleme yetkiniz yok.');
    }
    return await this.prisma.messages.update({
      where: {
        id: messageId,
      },
      data: {
        content: dto.content,
      },
    });
  }

  async deleteMessage(
    messageId: string,
    userId: string,
    dto: DeleteMessageQueryDto,
  ) {
    const message = await this.prisma.messages.findUnique({
      where: {
        id: messageId,
      },
    });
    if (!message) {
      throw new NotFoundException('Mesaj bulunamadı.');
    }
    const isParticipant = await this.prisma.participants.findFirst({
      where: {
        conversation_id: message.conversation_id,
        user_id: userId,
      },
    });
    if (!isParticipant) {
      throw new ForbiddenException('Bu konuşmaya erişim yetkiniz yok.');
    }

    if (dto.forEveryone) {
      const isSender = message.sender_id === userId;
      const isAdmin =
        isParticipant.role === ParticipantRole.ADMIN ||
        isParticipant.role === ParticipantRole.OWNER;
      if (!isSender && !isAdmin) {
        throw new ForbiddenException(
          'Bu mesajı herkes için silme yetkiniz yok.',
        );
      }
      return await this.prisma.messages.delete({
        where: {
          id: messageId,
        },
      });
    }

    const existingDeletion = await this.prisma.message_deletions.findUnique({
      where: {
        message_id_user_id: {
          message_id: messageId,
          user_id: userId,
        },
      },
    });
    if (existingDeletion) {
      return { message: 'Mesaj zaten silinmiş.' };
    }
    return await this.prisma.message_deletions.create({
      data: {
        message_id: messageId,
        user_id: userId,
      },
    });
  }
}
