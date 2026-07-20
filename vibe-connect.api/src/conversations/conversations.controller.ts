import {
  Controller,
  Post,
  Request,
  Body,
  UseGuards,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto } from './dtos/create_conversation.dto';
import { ConversationsService } from './conversations.service';

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
}
