import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersDto } from './dtos/search_users.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = {
  user: {
    id: string;
    username: string;
  };
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(
    @Request() req: AuthenticatedRequest,
    @Query() dto: SearchUsersDto,
  ) {
    return this.usersService.searchUsers(dto.q, req.user.id);
  }
}
