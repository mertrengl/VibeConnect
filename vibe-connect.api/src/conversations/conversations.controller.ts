import {
  Controller,
  Post,
  Request,
  Body,
  UseGuards,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto } from './dtos/create_conversation.dto';
import { ConversationsService } from './conversations.service';
import { SearchConversationsDto } from './dtos/search_conversations.dto';
import { MarkAsReadDto } from './dtos/mark_as_read.dto';

type AuthenticatedRequest = {
  user: {
    id: string;
    username: string;
  };
};

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationService: ConversationsService) {}

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    const userId = req.user.id;
    return await this.conversationService.createConversation(
      userId,
      createConversationDto,
    );
  }

  @Get()
  async getMyConversations(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return await this.conversationService.getUserConversations(userId);
  }

  @Get('search')
  async searchConversations(
    @Request() req: AuthenticatedRequest,
    @Query() dto: SearchConversationsDto,
  ) {
    return this.conversationService.searchConversations(req.user.id, dto.q);
  }

  @Get(':id')
  async getConversationById(
    @Param('id') conversationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.conversationService.getConversationById(
      conversationId,
      req.user.id,
    );
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') conversationId: string,
    @Body() dto: MarkAsReadDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.conversationService.markAsRead(
      conversationId,
      req.user.id,
      dto,
    );
  }
}
