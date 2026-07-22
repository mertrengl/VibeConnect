import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dtos/create_message.dto';
import { UpdateMessageDto } from './dtos/update_message.dto';
import { ParticipantRole } from '@prisma/client';
import { GetMessagesQueryDto } from './dtos/get_messages_query.dto';
import { DeleteMessageQueryDto } from './dtos/delete_message_query.dto';
import { ToggleReactionDto } from './dtos/toggle_reaction.dto';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessagesGateway))
    private messagesGateway: MessagesGateway,
  ) {}

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
        message_reactions: {
          include: {
            users: {
              select: { id: true, username: true },
            },
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
    const updatedMessage = await this.prisma.messages.update({
      where: {
        id: messageId,
      },
      data: {
        content: dto.content,
      },
    });
    this.messagesGateway.notifyMessageUpdate(
      message.conversation_id,
      updatedMessage,
    );
    return updatedMessage;
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
      const deletedMessage = await this.prisma.messages.delete({
        where: {
          id: messageId,
        },
      });
      this.messagesGateway.notifyMessageDelete(
        message.conversation_id,
        messageId,
      );
      return deletedMessage;
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

  async toggleReaction(
    messageId: string,
    userId: string,
    dto: ToggleReactionDto,
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

    const existingReaction = await this.prisma.message_reactions.findFirst({
      where: {
        message_id: messageId,
        user_id: userId,
      },
    });

    if (existingReaction) {
      if (existingReaction.emoji === dto.emoji) {
        await this.prisma.message_reactions.delete({
          where: {
            id: existingReaction.id,
          },
        });
        this.messagesGateway.notifyReactionRemoved(message.conversation_id, {
          messageId,
          userId,
          emoji: dto.emoji,
        });
        return { action: 'removed', emoji: dto.emoji };
      }
      await this.prisma.message_reactions.delete({
        where: {
          id: existingReaction.id,
        },
      });
      this.messagesGateway.notifyReactionRemoved(message.conversation_id, {
        messageId,
        userId,
        emoji: existingReaction.emoji,
      });
    }

    const newReaction = await this.prisma.message_reactions.create({
      data: {
        message_id: messageId,
        user_id: userId,
        emoji: dto.emoji,
      },
      include: {
        users: {
          select: { id: true, username: true },
        },
      },
    });
    this.messagesGateway.notifyReactionAdded(
      message.conversation_id,
      newReaction,
    );
    return { action: 'added', reaction: newReaction };
  }
}
