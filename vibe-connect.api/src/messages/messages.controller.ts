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
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dtos/create_message.dto';
import { UpdateMessageDto } from './dtos/update_message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { GetMessagesQueryDto } from './dtos/get_messages_query.dto';
import { DeleteMessageQueryDto } from './dtos/delete_message_query.dto';
import { ToggleReactionDto } from './dtos/toggle_reaction.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
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

  @Post('upload-media')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
      },
      fileFilter: (req, file, callback) => {
        if (
          !file.mimetype.match(
            /\/(jpg|jpeg|png|webp|gif|mp4|webm|quicktime|mov)$/,
          )
        ) {
          return callback(
            new BadRequestException(
              'Geçersiz dosya türü. Sadece resim ve video dosyalarına izin verilir.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    return await this.messagesService.uploadMedia(file);
  }
  @Get(':conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query() dto: GetMessagesQueryDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.messagesService.getConversationMessages(
      conversationId,
      req.user.id,
      dto,
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
    @Query() dto: DeleteMessageQueryDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.messagesService.deleteMessage(
      messageId,
      req.user.id,
      dto,
    );
  }

  @Post(':messageId/reactions')
  async toggleReaction(
    @Param('messageId') messageId: string,
    @Body() dto: ToggleReactionDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.messagesService.toggleReaction(
      messageId,
      req.user.id,
      dto,
    );
  }
}
