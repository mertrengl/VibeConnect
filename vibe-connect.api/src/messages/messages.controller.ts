import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dtos/create_message.dto';
import { UpdateMessageDto } from './dtos/update_message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
  };
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async createMessage(
    @Body() dto: CreateMessageDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.messagesService.createMessage(dto, req.user.id);
  }

  @Get(':conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Request() req: RequestWithUser,
  ) {
    return await this.messagesService.getConversationMessages(
      conversationId,
      req.user.id,
    );
  }

  @Put(':messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.messagesService.updateMessage(
      messageId,
      dto,
      req.user.id,
    );
  }

  @Delete(':messageId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Request() req: RequestWithUser,
  ) {
    return await this.messagesService.deleteMessage(messageId, req.user.id);
  }
}
