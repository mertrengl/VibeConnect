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
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto } from './dtos/create_conversation.dto';
import { ConversationsService } from './conversations.service';
import { SearchConversationsDto } from './dtos/search_conversations.dto';
import { MarkAsReadDto } from './dtos/mark_as_read.dto';
import { UpdateParticipantRoleDto } from './dtos/update_participant_role.dto';
import { AddParticipantDto } from './dtos/add_participant.dto';
import { GetPublicConversationsQueryDto } from './dtos/get_public_conversations_query.dto';

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

  @Get('public')
  async getPublicConversations(
    @Request() req: AuthenticatedRequest,
    @Query() dto: GetPublicConversationsQueryDto,
  ) {
    return this.conversationService.getPublicConversations(req.user.id, dto.q);
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
  @Post(':id/join')
  async joinPublicConversation(
    @Param('id') conversationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.conversationService.joinPublicConversation(
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

  @Post(':id/participants')
  async addParticipant(
    @Param('id') conversationId: string,
    @Body() dto: AddParticipantDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.conversationService.addParticipants(
      conversationId,
      req.user.id,
      dto,
    );
  }

  @Delete(':id/participants/:userId')
  async deleteParticipant(
    @Param('id') conversationId: string,
    @Param('userId') targetUserId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.conversationService.deleteParticipant(
      conversationId,
      req.user.id,
      targetUserId,
    );
  }

  @Patch(':id/participants/:userId')
  async updateParticipantRole(
    @Param('id') conversationId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateParticipantRoleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.conversationService.updateParticipantRole(
      conversationId,
      req.user.id,
      targetUserId,
      dto,
    );
  }
}
